package com.pipre.backend.adapters.in.web.controller;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real JWT login, filters, controller, use case, JPA and migrated H2 data. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:catalog_http;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
@AutoConfigureMockMvc
class TetriLogicTemplateHttpTest {
    @Autowired private MockMvc mvc;
    @Autowired private TestRestTemplate http;

    @Test void realHttpMethodRejectionPreservesAuthenticationAndAllowHeader() {
        var login = http.postForEntity("/api/v1/auth/login",
                Map.of("email", "alumno@pipre.com", "password", "123"), Map.class);
        assertEquals(200, login.getStatusCode().value());
        var cookie = login.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertNotNull(cookie);
        var headers = new HttpHeaders();
        headers.add(HttpHeaders.COOKIE, cookie.split(";", 2)[0]);
        headers.setContentType(MediaType.APPLICATION_JSON);
        var path = "/api/v1/tetrilogic/templates/tetrilogic-v2-30";
        var rejected = http.exchange(path, HttpMethod.POST, new HttpEntity<>("{}", headers), Map.class);
        assertEquals(405, rejected.getStatusCode().value());
        assertTrue(rejected.getHeaders().getAllow().contains(HttpMethod.GET));
        assertNotNull(rejected.getBody());
        assertEquals("Método no permitido", rejected.getBody().get("error"));
        assertEquals(200, http.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), Map.class)
                .getStatusCode().value());
        assertEquals(401, http.postForEntity(path, Map.of(), Map.class).getStatusCode().value());
    }

    private Cookie studentSession() throws Exception {
        var response = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alumno@pipre.com\",\"password\":\"123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse();
        var header = response.getHeader("Set-Cookie");
        assertNotNull(header);
        return new Cookie("jwt", header.split(";", 2)[0].split("=", 2)[1]);
    }

    @Test void anonymousCannotReadOfficialConfiguration() throws Exception {
        mvc.perform(get("/api/v1/tetrilogic/templates/tetrilogic-v2-30"))
                .andExpect(status().isUnauthorized());
    }

    @Test void authenticatedStudentReadsPersistedBoardAndThirtyOfficialActivities() throws Exception {
        var cookie = studentSession();
        mvc.perform(get("/api/v1/tetrilogic/templates/tetrilogic-v2-30").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.templateId").value("tetrilogic-v2-30"))
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.config.level").value(30))
                .andExpect(jsonPath("$.config.boardSize.rows").value(6))
                .andExpect(jsonPath("$.config.constraints.length()").value(12))
                .andExpect(jsonPath("$.config.inventory.length()").value(3))
                .andExpect(jsonPath("$.config.placements").doesNotExist())
                .andExpect(jsonPath("$.config.solution").doesNotExist());
        mvc.perform(get("/api/v1/activities/lesson/les-c002-r1?size=50").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(30))
                .andExpect(jsonPath("$.content.length()").value(30));
    }

    @Test void unknownBoardRemainsAbsentAndNoWriteEndpointIsExposed() throws Exception {
        var cookie = studentSession();
        mvc.perform(get("/api/v1/tetrilogic/templates/tetrilogic-v2-31").cookie(cookie))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/tetrilogic/templates/tetrilogic-v2-30").cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isMethodNotAllowed());
    }
}
