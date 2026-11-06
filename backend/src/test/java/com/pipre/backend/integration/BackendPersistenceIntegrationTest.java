package com.pipre.backend.integration;

import com.fasterxml.jackson.databind.*;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.application.useCases.*;
import com.pipre.backend.infrastructure.security.JwtUtils;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Tag("integration")
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:backend_audit;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.show-sql=false","pipre.seed.demo-data=false",
    "spring.flyway.placeholders.telemetry_fk_validation="})
@AutoConfigureMockMvc
class BackendPersistenceIntegrationTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry properties) {
        if("true".equals(System.getenv("PIPRE_AUDIT_POSTGRES"))) {
            // Fixed isolated container alias/database, never accept an arbitrary production URL.
            properties.add("spring.datasource.url",()->"jdbc:postgresql://audit-db:5432/pipre_audit");
            properties.add("spring.datasource.driver-class-name",()->"org.postgresql.Driver");
            properties.add("spring.datasource.username",()->"audit");properties.add("spring.datasource.password",()->"audit-test-only");
            properties.add("spring.jpa.database-platform",()->"org.hibernate.dialect.PostgreSQLDialect");
            properties.add("spring.flyway.placeholders.telemetry_fk_validation",()->"NOT VALID");
        }
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired JwtUtils jwt;
    @Autowired RegisterUserService users;
    @Autowired CreateCourseService courses;
    @Autowired CreateModuleService modules;
    @Autowired CreateLessonService lessons;
    @Autowired SaveModuleProgressService progress;
    @Autowired AddStudentRankingService rankings;
    @Autowired ProceduralDailyService daily;
    @Autowired ProceduralDailyGenerator generator;
    @Autowired GameSessionsService sessions;
    @Autowired @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping mapping;
    String student,email,course,module,lesson,group;
    Cookie owner,teacher;
    @BeforeEach void fixtures() {
        email="audit-"+UUID.randomUUID()+"@test.invalid";
        String role=jdbc.queryForObject("SELECT id_role FROM roles WHERE name='STUDENT'",String.class);
        student=users.execute(new RegisterUserCommand("Audit","Student",email,"Audit-test-only","QA",18,List.of(role)));
        course=courses.execute(new RegisterCourseCommand("Audit course","isolated fixture","LOW"));
        module=modules.execute(new CreateModuleCommand(course,"Audit module"));lesson=lessons.execute(new CreateLessonCommand(module,"Audit lesson"));
        group=UUID.randomUUID().toString();jdbc.update("INSERT INTO groups(id_group,group_name) VALUES (?,?)",group,"Audit group");
        owner=new Cookie("jwt",jwt.createToken(email,List.of("ROLE_STUDENT")));
        teacher=new Cookie("jwt",jwt.createToken(email,List.of("ROLE_TEACHER")));
    }
    @AfterEach void cleanup() {
        // Only fixtures created by this test, in the dedicated in-memory/container database.
        if(student!=null)jdbc.update("DELETE FROM users WHERE id_user=? AND email=?",student,email);
        if(group!=null)jdbc.update("DELETE FROM groups WHERE id_group=? AND group_name='Audit group'",group);
        if(course!=null)jdbc.update("DELETE FROM courses WHERE id_course=? AND name='Audit course'",course);
    }
    @Test void curriculumCrudPaginationRolesAndPartialUpdatePreserveBoard() throws Exception {
        var body=new HashMap<String,Object>();body.put("idLesson",lesson);body.put("name","Audit board");body.put("environment","neonflow");body.put("levelTemplate","neonflow-v2-2");body.put("logicLevel",2);
        mvc.perform(post("/api/v1/activities").cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/activities").cookie(teacher).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isCreated()).andExpect(content().string(""));
        String activity=jdbc.queryForObject("SELECT id_activity FROM activities WHERE id_lesson=?",String.class,lesson);
        mvc.perform(put("/api/v1/activities/"+activity).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"Edited\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/activities/"+activity).cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.levelTemplate").value("neonflow-v2-2")).andExpect(jsonPath("$.idLesson").value(lesson));
        mvc.perform(get("/api/v1/activities/lesson/"+lesson+"?page=0&size=1").cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        body.put("logicLevel",99);
        mvc.perform(post("/api/v1/activities").cookie(teacher).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
        mvc.perform(delete("/api/v1/activities/"+activity).cookie(teacher)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/activities/"+activity).cookie(owner)).andExpect(status().isNotFound());
    }
    @Test void missingReferencesAndInvalidInputNeverLeavePartialRows() throws Exception {
        int before=jdbc.queryForObject("SELECT COUNT(*) FROM activity_results WHERE id_student=?",Integer.class,student);
        mvc.perform(post("/api/v1/activity-results").cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idActivity","missing","score",10,"attempts",1)))).andExpect(status().isNotFound());
        assertEquals(before,jdbc.queryForObject("SELECT COUNT(*) FROM activity_results WHERE id_student=?",Integer.class,student));
        mvc.perform(post("/api/v1/module-progress").cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idModule",module,"percentage",101)))).andExpect(status().isBadRequest());
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM module_progress WHERE id_student=?",Integer.class,student));
        mvc.perform(post("/api/v1/lessons").cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"idModule\":\"missing\",\"title\":\"Invalid\"}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/modules").cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"idCourse\":\"missing\",\"title\":\"Invalid\"}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/activities").cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"idLesson\":\"missing\",\"name\":\"Invalid\",\"environment\":\"neonflow\",\"levelTemplate\":\"neonflow-v2-2\"}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/help-requests").cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"idStudent\":\"missing\",\"aiInteractions\":0}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/simulations").cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idActivity","missing","result","SUCCESS","blocksUsage",1)))).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/module-progress").cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idModule","missing","percentage",10)))).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/group-students").cookie(teacher).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idGroup",group,"idStudent","missing")))).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/group-students").cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM group_students WHERE id_group=?",Integer.class,group));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM simulations WHERE id_student=?",Integer.class,student));
    }
    @Test void simultaneousAcademicProgressWritesProduceOneRow() throws Exception {
        try(var pool=Executors.newFixedThreadPool(4)) {
            var jobs=new ArrayList<Callable<String>>();for(int i=0;i<8;i++)jobs.add(()->progress.execute(new SaveModuleProgressCommand(student,module,BigDecimal.TEN,"IN_PROGRESS")));
            var results=pool.invokeAll(jobs);String id=results.get(0).get();for(var result:results)assertEquals(id,result.get());
        }
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM module_progress WHERE id_student=? AND id_module=?",Integer.class,student,module));
    }
    @Test void simultaneousGroupAssignmentsPreserveOneMembershipAndItsHistory() throws Exception {
        try(var pool=Executors.newFixedThreadPool(4)) {
            var jobs=new ArrayList<Callable<Void>>();
            for(int i=0;i<8;i++)jobs.add(()->{rankings.execute(new AddStudentRankingCommand(group,student));return null;});
            for(var result:pool.invokeAll(jobs))result.get();
        }
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM group_students WHERE id_group=? AND id_student=?",Integer.class,group,student));
        jdbc.update("UPDATE group_students SET xp_total=500,total_stars=9 WHERE id_group=? AND id_student=?",group,student);
        mvc.perform(post("/api/v1/group-students").cookie(teacher).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("idGroup",group,"idStudent",student))))
                .andExpect(status().isCreated()).andExpect(content().string(""));
        assertEquals(500,jdbc.queryForObject("SELECT xp_total FROM group_students WHERE id_group=? AND id_student=?",Integer.class,group,student));
        assertEquals(9,jdbc.queryForObject("SELECT total_stars FROM group_students WHERE id_group=? AND id_student=?",Integer.class,group,student));
    }
    @Test void realAuthenticationAndOwnershipContracts() throws Exception {
        mvc.perform(get("/api/v1/daily-challenges/today/set?studentId="+student)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email",email,"password","Audit-test-only")))).andExpect(status().isOk()).andExpect(header().string("Set-Cookie",org.hamcrest.Matchers.containsString("HttpOnly")));
        mvc.perform(get("/api/v1/profile/another-student/game-progress").cookie(owner)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/roles/user").cookie(owner).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
    }
    @Test void removingTheLeaderReordersTheRemainingGroupRanking() throws Exception {
        String otherEmail="audit-"+UUID.randomUUID()+"@test.invalid";
        String role=jdbc.queryForObject("SELECT id_role FROM roles WHERE name='STUDENT'",String.class);
        String other=users.execute(new RegisterUserCommand("Audit","Other",otherEmail,"Audit-test-only","QA",18,List.of(role)));
        try {
            jdbc.update("INSERT INTO group_students(id_ranking,id_group,id_student,total_points,position) VALUES (?,?,?,?,?)",UUID.randomUUID().toString(),group,student,20,1);
            jdbc.update("INSERT INTO group_students(id_ranking,id_group,id_student,total_points,position) VALUES (?,?,?,?,?)",UUID.randomUUID().toString(),group,other,10,2);
            mvc.perform(delete("/api/v1/group-students/"+group+"/"+student).cookie(teacher)).andExpect(status().isNoContent());
            assertEquals(1,jdbc.queryForObject("SELECT position FROM group_students WHERE id_group=? AND id_student=?",Integer.class,group,other));
            mvc.perform(delete("/api/v1/group-students/"+group+"/"+student).cookie(teacher)).andExpect(status().isNoContent());
            assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM group_students WHERE id_group=?",Integer.class,group));
            mvc.perform(delete("/api/v1/group-students/missing/"+student).cookie(teacher)).andExpect(status().isNoContent());
        } finally {
            jdbc.update("DELETE FROM users WHERE id_user=? AND email=?",other,otherEmail);
        }
    }
    @Test void officialPairedVictoriesAwardXpOnlyOnceAcrossConcurrentAndNewSessions() throws Exception {
        int attempt=0;
        for(String game:List.of("neonflow","tetrilogic","tetrilogic")) {
            var witness=generator.generate(new com.pipre.backend.application.ports.output.DailyChallengeSelectionPolicy.Specification(game,1,0,0,0,0)).witness();
            var started=sessions.start(new StartGameSessionCommand(student,UUID.randomUUID().toString(),game,game+"-v2-1",null,null));
            int sequence=0;
            for(var p:witness.path("placements"))sessions.action(student,started.sessionId(),new GameSessionAction(++sequence,"PLACE",p.path("id").asText(null),p.path("position").path("x").asInt(),p.path("position").path("y").asInt(),p.path("rotation").asInt(),p.path("type").asText(null),p.path("color").asText(null),null));
            try(var pool=Executors.newFixedThreadPool(3)) {
                var jobs=List.<Callable<com.pipre.backend.application.dto.GameCompletionDTO>>of(()->sessions.complete(student,started.sessionId()),()->sessions.complete(student,started.sessionId()),()->sessions.complete(student,started.sessionId()));
                var results=pool.invokeAll(jobs);var receipt=results.get(0).get();
                for(var result:results)assertEquals(receipt,result.get());
                assertEquals(attempt==1?List.of("L01"):List.of(),receipt.newAchievements().stream().map(a->a.code()).toList());
            }
            attempt++;
        }
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM achievement_xp_ledger WHERE student_id=?",Integer.class,student));
        assertEquals(100,jdbc.queryForObject("SELECT SUM(amount) FROM achievement_xp_ledger WHERE student_id=?",Integer.class,student));
        assertEquals(100,jdbc.queryForObject("SELECT earned_xp FROM gamification_accounts WHERE student_id=?",Integer.class,student));
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM game_level_progress WHERE student_id=?",Integer.class,student));
        assertEquals(3,jdbc.queryForObject("SELECT COUNT(*) FROM verified_game_victories WHERE student_id=?",Integer.class,student));
    }
    @Test void fiveDailyVictoriesAreAtomicIdempotentAndIsolatedFromOfficialProgress() throws Exception {
        var initial=daily.today(student);assertEquals(5,initial.challenges().size());assertEquals(initial,daily.today(student));
        for(var c:initial.challenges()) {
            JsonNode original=json.readTree(getClass().getResourceAsStream("/catalog/"+c.game()+"-v2.json")).get(c.levelNumber()-1);
            int dx=c.game().equals("neonflow")?c.config().path("emitter").path("position").path("x").asInt()-original.path("emitter").path("position").path("x").asInt():c.config().path("constraints").findValues("line").get(0).asInt();
            int dy=0;
            if(c.game().equals("neonflow"))dy=c.config().path("emitter").path("position").path("y").asInt()-original.path("emitter").path("position").path("y").asInt();
            else { for(JsonNode line:c.config().path("constraints")) { if(line.path("orientation").asText().equals("row")){dy=line.path("line").asInt();break;} } for(JsonNode line:c.config().path("constraints")) {if(line.path("orientation").asText().equals("column")){dx=line.path("line").asInt();break;}} }
            // Padding split is reconstructed from translated anchors and the persisted dimensions.
            int right=c.game().equals("neonflow")?c.config().path("width").asInt()-original.path("width").asInt()-dx:c.config().path("boardSize").path("cols").asInt()-original.path("boardSize").path("cols").asInt()-dx;
            int bottom=c.game().equals("neonflow")?c.config().path("height").asInt()-original.path("height").asInt()-dy:c.config().path("boardSize").path("rows").asInt()-original.path("boardSize").path("rows").asInt()-dy;
            var witness=generator.generate(new com.pipre.backend.application.ports.output.DailyChallengeSelectionPolicy.Specification(c.game(),c.levelNumber(),dx,dy,right,bottom)).witness();
            var started=sessions.start(new StartGameSessionCommand(student,UUID.randomUUID().toString(),c.game(),c.levelTemplate(),null,c.id()));
            int sequence=0;for(var p:witness.path("placements"))sessions.action(student,started.sessionId(),new GameSessionAction(++sequence,"PLACE",p.path("id").asText(null),p.path("position").path("x").asInt(),p.path("position").path("y").asInt(),p.path("rotation").asInt(),p.path("type").asText(null),p.path("color").asText(null),null));
            try(var pool=Executors.newFixedThreadPool(3)) {
                var jobs=List.<Callable<com.pipre.backend.application.dto.GameCompletionDTO>>of(()->sessions.complete(student,started.sessionId()),()->sessions.complete(student,started.sessionId()),()->sessions.complete(student,started.sessionId()));
                var receipts=pool.invokeAll(jobs);var receipt=receipts.get(0).get();for(var result:receipts)assertEquals(receipt,result.get());assertEquals(c.slot()==5,receipt.daily().completed());
            }
            assertEquals(c.slot()*20,daily.today(student).progressPercent());
            assertEquals(c.slot()==5?1:0,jdbc.queryForObject("SELECT COUNT(*) FROM daily_challenge_completions WHERE student_id=?",Integer.class,student));
        }
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM game_level_progress WHERE student_id=?",Integer.class,student));
        assertEquals(5,jdbc.queryForObject("SELECT COUNT(*) FROM verified_game_victories WHERE student_id=?",Integer.class,student));
    }
    @Test void registeredApiInventoryHasExplicitAuthorization() throws Exception {
        var inventory=new ArrayList<Map<String,Object>>();
        mapping.getHandlerMethods().forEach((info,method)->{
            if(!method.getBeanType().getPackageName().startsWith("com.pipre.backend"))return;
            var auth=method.getMethodAnnotation(PreAuthorize.class);if(auth==null)auth=method.getBeanType().getAnnotation(PreAuthorize.class);
            for(String path:info.getPatternValues()) {
                boolean publicPath=path.equals("/")||path.startsWith("/api/v1/auth/")||(path.equals("/api/v1/users")&&info.getMethodsCondition().getMethods().contains(org.springframework.web.bind.annotation.RequestMethod.POST));
                assertTrue(publicPath||auth!=null,"Endpoint without authorization: "+path);
                inventory.add(Map.of("path",path,"methods",info.getMethodsCondition().toString(),"authorization",auth==null?"public":auth.value(),"controller",method.getBeanType().getSimpleName()));
            }
        });
        assertTrue(inventory.size()>35);Files.createDirectories(Path.of("target"));json.writerWithDefaultPrettyPrinter().writeValue(Path.of("target/api-contract-inventory.json").toFile(),inventory);
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andExpect(jsonPath("$.paths").isMap());
    }
}
