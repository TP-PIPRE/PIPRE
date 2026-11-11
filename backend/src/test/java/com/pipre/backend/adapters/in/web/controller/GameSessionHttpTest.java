package com.pipre.backend.adapters.in.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
    "spring.datasource.url=jdbc:h2:mem:verified_game_http;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.show-sql=false",
    "spring.flyway.placeholders.telemetry_fk_validation="
})
@AutoConfigureMockMvc
@org.junit.jupiter.api.Tag("integration")
class GameSessionHttpTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    private record Login(String id,Cookie cookie) {}
    private Login login(String email,String password) throws Exception {
        var response=mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("email",email,"password",password))))
            .andExpect(status().isOk()).andReturn().getResponse();
        String header=response.getHeader("Set-Cookie");assertNotNull(header);
        return new Login(json.readTree(response.getContentAsString()).path("user").path("idUser").asText(),new Cookie("jwt",header.split(";",2)[0].split("=",2)[1]));
    }
    private JsonNode start(Login owner,int level) throws Exception {
        var response=mvc.perform(post("/api/v1/game-sessions").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner.cookie()).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("studentId",owner.id(),"clientSessionId",UUID.randomUUID().toString(),"game","neonflow","levelTemplate","neonflow-v2-"+level))))
            .andExpect(status().isOk()).andReturn().getResponse();
        return json.readTree(response.getContentAsString());
    }
    @Test void actualJwtJpaJdbcAndMigratedDatabaseValidateVictoryAndExactRetry() throws Exception {
        var owner=login("alumno@pipre.com","123");var session=start(owner,2);String id=session.path("sessionId").asText();
        mvc.perform(post("/api/v1/game-sessions/"+id+"/complete").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner.cookie())).andExpect(status().isBadRequest());
        for(int i=0;i<2;i++) {
            var body=Map.of("sequence",i+1,"type","PLACE","x",1,"y",i==0?2:0,"rotation",0,"component","MIRROR_90");
            var first=mvc.perform(post("/api/v1/game-sessions/"+id+"/actions").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner.cookie()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(i+1)).andExpect(jsonPath("$.state.lastActionRejected").value(false)).andReturn().getResponse().getContentAsString();
            var retry=mvc.perform(post("/api/v1/game-sessions/"+id+"/actions").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner.cookie()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            assertEquals(json.readTree(first),json.readTree(retry));
        }
        var first=mvc.perform(post("/api/v1/game-sessions/"+id+"/complete").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner.cookie()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.stars").value(3)).andExpect(jsonPath("$.levelNumber").value(2)).andReturn().getResponse().getContentAsString();
        var retry=mvc.perform(post("/api/v1/game-sessions/"+id+"/complete").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner.cookie()))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(json.readTree(first),json.readTree(retry));
        assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM verified_game_victories WHERE session_id=?",Integer.class,id));
        assertEquals(2,jdbc.queryForObject("SELECT count(*) FROM game_session_actions WHERE session_id=?",Integer.class,id));
    }
    @Test void currentStudentCannotWriteAnotherStudentsSessionOrSpoofStartIdentity() throws Exception {
        var owner=login("alumno@pipre.com","123");var session=start(owner,1);
        String marker="session-ownership-"+UUID.randomUUID()+"@test.invalid";
        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
            "firstName","QA","lastName","Session","email",marker,"passwordHash","Session-123-test","age",18,"grade","QA"))))
            .andExpect(status().isCreated());
        var other=login(marker,"Session-123-test");
        mvc.perform(post("/api/v1/game-sessions/"+session.path("sessionId").asText()+"/complete").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(other.cookie())).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/game-sessions").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(other.cookie()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
            "studentId",owner.id(),"clientSessionId",UUID.randomUUID().toString(),"game","neonflow","levelTemplate","neonflow-v2-1"))))
            .andExpect(status().isForbidden());
        assertEquals("ACTIVE",jdbc.queryForObject("SELECT status FROM game_sessions WHERE session_id=?",String.class,session.path("sessionId").asText()));
    }
    @Test void authenticationAndStaffPreviewCannotCreateStudentProgress() throws Exception {
        mvc.perform(post("/api/v1/game-sessions").contentType(MediaType.APPLICATION_JSON).content("{}" )).andExpect(status().isUnauthorized());
        var staff=login("docente@pipre.com","123");
        mvc.perform(post("/api/v1/game-sessions").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(staff.cookie()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
            "studentId",staff.id(),"clientSessionId",UUID.randomUUID().toString(),"game","neonflow","levelTemplate","neonflow-v2-1"))))
            .andExpect(status().isForbidden());
    }
}
