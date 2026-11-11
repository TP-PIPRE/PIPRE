package com.pipre.backend.integration;

import com.fasterxml.jackson.databind.*;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.application.useCases.*;
import com.pipre.backend.application.ports.output.ProgressiveHintGeneratorPort;
import com.pipre.backend.domain.entities.game.ExercisePointsRules;
import com.pipre.backend.domain.exceptions.GameHintPendingException;
import com.pipre.backend.domain.exceptions.ProgressiveHintUnavailableException;
import com.pipre.backend.infrastructure.configuration.ProgressiveTutorProperties;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
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
    @Autowired CreateModuleService modules;
    @Autowired CreateLessonService lessons;
    @Autowired SaveModuleProgressService progress;
    @Autowired AddStudentRankingService rankings;
    @Autowired ProceduralDailyService daily;
    @Autowired ProceduralDailyGenerator generator;
    @Autowired GameSessionsService sessions;
    @Autowired ProgressiveTutorService progressiveTutor;
    @Autowired ProgressiveTutorProperties progressiveProperties;
    @MockitoBean ProgressiveHintGeneratorPort hintGenerator;
    @Autowired com.pipre.backend.application.ports.output.TutorPilotAccessPort tutorPilotAccess;
    @Autowired com.pipre.backend.infrastructure.security.LoginAttemptLimiter loginLimiter;
    @Autowired AcademicAdministrationService administration;
    @Autowired @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping mapping;
    String student,email,course,module,lesson,group;
    Cookie owner,teacher,administrator;
    String teacherId,teacherEmail,adminId,adminEmail;
    @BeforeEach void fixtures() {
        email="audit-"+UUID.randomUUID()+"@test.invalid";
        String role=jdbc.queryForObject("SELECT id_role FROM roles WHERE name='STUDENT'",String.class);
        student=users.execute(new RegisterUserCommand("Audit","Student",email,"Audit-test-only","QA",18,List.of(role)));
        course=insertCourseFixture("Audit course");
        module=modules.execute(new CreateModuleCommand(course,"Audit module"));lesson=lessons.execute(new CreateLessonCommand(module,"Audit lesson"));
        group=UUID.randomUUID().toString();jdbc.update("INSERT INTO groups(id_group,group_name) VALUES (?,?)",group,"Audit group");
        owner=new Cookie("jwt",jwt.createToken(email,List.of("ROLE_STUDENT")));
        teacherEmail="audit-teacher-"+UUID.randomUUID()+"@test.invalid";
        adminEmail="audit-admin-"+UUID.randomUUID()+"@test.invalid";
        teacherId=users.execute(new RegisterUserCommand("Audit","Teacher",teacherEmail,"Audit-test-only","QA",35,List.of(jdbc.queryForObject("SELECT id_role FROM roles WHERE name='TEACHER'",String.class))));
        adminId=users.execute(new RegisterUserCommand("Audit","Admin",adminEmail,"Audit-test-only","QA",35,List.of(jdbc.queryForObject("SELECT id_role FROM roles WHERE name='ADMIN'",String.class))));
        teacher=new Cookie("jwt",jwt.createToken(teacherEmail,List.of("ROLE_TEACHER")));
        administrator=new Cookie("jwt",jwt.createToken(adminEmail,List.of("ROLE_ADMIN")));
        jdbc.update("INSERT INTO teacher_courses(id_teacher,id_course) VALUES (?,?)",teacherId,course);
        jdbc.update("INSERT INTO teacher_groups(id_teacher,id_group) VALUES (?,?)",teacherId,group);
    }
    private String insertCourseFixture(String name) {
        String id = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO courses(id_course,name,description,level,created_at) VALUES (?,?,'isolated fixture','LOW',CURRENT_TIMESTAMP)",id,name);
        return id;
    }
    @AfterEach void cleanup() {
        // Only fixtures created by this test, in the dedicated in-memory/container database.
        if(student!=null)jdbc.update("DELETE FROM users WHERE id_user=? AND email=?",student,email);
        if(teacherId!=null)jdbc.update("DELETE FROM users WHERE id_user=? AND email=?",teacherId,teacherEmail);
        if(adminId!=null)jdbc.update("DELETE FROM users WHERE id_user=? AND email=?",adminId,adminEmail);
        if(group!=null)jdbc.update("DELETE FROM groups WHERE id_group=? AND group_name='Audit group'",group);
        if(course!=null)jdbc.update("DELETE FROM courses WHERE id_course=? AND name='Audit course'",course);
    }
    @Test void progressiveNeonAdvicePersistsAndChargesOnlyDeliveredExtrasInTheirAttempt() throws Exception {
        progressiveProperties.setEnabled(true);
        try {
            var first = startProgressiveLevel(1);
            assertTrue(first.state().path("neonFlowProgressiveTutor").asBoolean());
            String path = "/api/v1/game-sessions/" + first.sessionId() + "/progressive-hints";
            for (int ordinal = 1; ordinal <= 5; ordinal++) {
                var request = new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 0, ordinal, false);
                requestProgressive(path, request).andExpect(status().isOk())
                        .andExpect(jsonPath("$.ordinal").value(ordinal)).andExpect(jsonPath("$.source").value("STATIC"));
                if (ordinal == 5) requestProgressive(path, request).andExpect(status().isOk())
                        .andExpect(jsonPath("$.requestId").value(request.requestId()));
            }
            verifyNoInteractions(hintGenerator);
            mvc.perform(get(path).cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.deliveredCount").value(5));
            mvc.perform(get(path).cookie(teacher)).andExpect(status().isForbidden());

            when(hintGenerator.generate(any())).thenThrow(new ProgressiveHintUnavailableException());
            requestProgressive(path, new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 0, 6, false))
                    .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("HINT_UNAVAILABLE"));
            assertEquals(5, progressiveTutor.status(student, first.sessionId()).deliveredCount());

            var entered = new CountDownLatch(1);
            var release = new CountDownLatch(1);
            doAnswer(invocation -> {
                entered.countDown();
                if (!release.await(8, TimeUnit.SECONDS)) throw new AssertionError("Timed out waiting for the concurrent request");
                return "Comprueba si el color del haz coincide con el receptor.";
            }).doReturn("Sigue el tramo visible desde el emisor antes de comprobar.",
                    "Compara la trayectoria del haz con la que imaginaste.",
                    "Revisa dónde termina el haz y explica por qué llega hasta allí.").when(hintGenerator).generate(any());
            var sixth = new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 0, 6, false);
            try (var executor = Executors.newSingleThreadExecutor()) {
                var delivery = executor.submit(() -> progressiveTutor.request(student, first.sessionId(), sixth));
                try {
                    assertTrue(entered.await(8, TimeUnit.SECONDS));
                    assertThrows(GameHintPendingException.class, () -> progressiveTutor.request(student, first.sessionId(), sixth));
                    assertThrows(GameHintPendingException.class, () -> sessions.complete(student, first.sessionId()));
                    assertTrue(progressiveTutor.status(student, first.sessionId()).generating());
                } finally {
                    release.countDown();
                }
                assertEquals(6, delivery.get(8, TimeUnit.SECONDS).ordinal());
            }
            for (int ordinal = 7; ordinal <= 8; ordinal++) {
                requestProgressive(path, new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 0, ordinal, false))
                        .andExpect(status().isOk()).andExpect(jsonPath("$.source").value("GENERATIVE"));
            }
            requestProgressive(path, new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 0, 9, false))
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("HINT_CONFIRMATION_REQUIRED"));
            assertEquals(8, progressiveTutor.status(student, first.sessionId()).deliveredCount());

            // Simulate three measured waits without slowing down the integration test.
            OffsetDateTime startedAt = OffsetDateTime.now(ZoneOffset.UTC).minusSeconds(65);
            jdbc.update("UPDATE game_sessions SET started_at=? WHERE session_id=?", startedAt, first.sessionId());
            jdbc.update("UPDATE neonflow_tutor_requests SET finished_at=started_at WHERE session_id=? AND status='FAILED'", first.sessionId());
            for (int ordinal = 6; ordinal <= 8; ordinal++) {
                OffsetDateTime requestedAt = startedAt.plusSeconds(10L + 13L * (ordinal - 6));
                jdbc.update("""
                        UPDATE neonflow_tutor_requests SET started_at=?, finished_at=?, expires_at=?
                        WHERE session_id=? AND delivered_ordinal=?
                        """, requestedAt, requestedAt.plusSeconds(12), requestedAt.plusSeconds(20), first.sessionId(), ordinal);
            }
            solveProgressiveNeonLevelOne(first.sessionId());
            var firstVictory = sessions.complete(student, first.sessionId());
            assertEquals(3, firstVictory.stars());
            assertTrue(firstVictory.durationMs() >= 65_000);
            assertEquals(ExercisePointsRules.points(2, 2, firstVictory.durationMs() - 36_000), firstVictory.score().points());
            assertNotEquals(ExercisePointsRules.points(2, 2, firstVictory.durationMs()), firstVictory.score().points());

            var other = startProgressiveLevel(2);
            assertEquals(0, progressiveTutor.status(student, other.sessionId()).deliveredCount());
            var replay = startProgressiveLevel(1);
            assertEquals(8, progressiveTutor.status(student, replay.sessionId()).deliveredCount());
            var ninth = new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 0, 9, true);
            assertEquals(9, progressiveTutor.request(student, replay.sessionId(), ninth).ordinal());
            solveProgressiveNeonLevelOne(replay.sessionId());
            assertEquals(2, sessions.complete(student, replay.sessionId()).stars());
            var another = startProgressiveLevel(1);
            assertEquals(9, progressiveTutor.status(student, another.sessionId()).deliveredCount());
            solveProgressiveNeonLevelOne(another.sessionId());
            assertEquals(3, sessions.complete(student, another.sessionId()).stars());
            assertEquals(9L, jdbc.queryForObject("SELECT COUNT(*) FROM neonflow_tutor_requests WHERE student_id=? AND status='DELIVERED'", Long.class, student));
        } finally {
            progressiveProperties.setEnabled(false);
        }
    }

    private com.pipre.backend.application.dto.GameSessionDTO startProgressiveLevel(int level) {
        return sessions.start(new StartGameSessionCommand(student, UUID.randomUUID().toString(), "neonflow",
                "neonflow-v3-" + level, "act-c001-v2-" + level, null));
    }

    private void solveProgressiveNeonLevelOne(String sessionId) throws Exception {
        try (var stream = getClass().getResourceAsStream("/catalog/neonflow-v3-witnesses.json")) {
            int sequence = 0;
            for (JsonNode placement : json.readTree(stream).get(0).path("placements")) {
                var position = placement.path("position");
                sessions.action(student, sessionId, new GameSessionAction(++sequence, "PLACE", null,
                        position.path("x").asInt(), position.path("y").asInt(), placement.path("rotation").asInt(), "MIRROR_90", null, null));
            }
        }
    }

    @Test void neonRevisionReplacesOfficialBindingsAndSharesBestPointsWithTheOriginal() throws Exception {
        var legacy = sessions.start(new StartGameSessionCommand(student, UUID.randomUUID().toString(), "neonflow", "neonflow-v2-1", null, null));
        var previous = sessions.complete(student, legacy.sessionId());
        assertEquals(30, jdbc.queryForObject("SELECT COUNT(*) FROM activities WHERE environment='neonflow' AND level_template LIKE 'neonflow-v3-%'", Integer.class));
        mvc.perform(get("/api/v1/activities/act-c001-v2-1").cookie(owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.levelTemplate").value("neonflow-v3-1"));
        mvc.perform(get("/api/v1/neonflow/templates/neonflow-v3-1").cookie(owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(3));
        var revised = startProgressiveLevel(1);
        assertThrows(com.pipre.backend.domain.exceptions.IncompleteGameBoardException.class, () -> sessions.complete(student, revised.sessionId()));
        solveProgressiveNeonLevelOne(revised.sessionId());
        var victory = sessions.complete(student, revised.sessionId());
        assertEquals(Math.max(previous.score().points(), victory.score().points()), victory.score().totalPoints());
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM game_best_scores WHERE student_id=?", Integer.class, student));
    }

    @Test void progressiveTetriAdviceUsesVerifiedCountsAndChargesOnlyTheAttemptWithAnExtra() throws Exception {
        progressiveProperties.setEnabled(true);
        try {
            String first = startTetriTutorAttempt();
            assertTrue(sessions.active(student, "tetrilogic", "tetrilogic-v2-1", "act-c002-1", null)
                    .orElseThrow().state().path("progressiveTutor").asBoolean());
            var fixed = new HashSet<String>();
            for (int ordinal = 1; ordinal <= 5; ordinal++) {
                var hint = progressiveTutor.request(student, first,
                        new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 0, ordinal, false));
                assertEquals("STATIC", hint.source());
                assertTrue(fixed.add(hint.message()));
            }
            assertTrue(fixed.stream().anyMatch(message -> message.contains("fila 1 tiene un objetivo de 3")));
            verifyNoInteractions(hintGenerator);

            sessions.action(student, first, new GameSessionAction(1, "PLACE", "i1", 3, 0, 90, null, null, null));
            when(hintGenerator.generate(any())).thenThrow(new ProgressiveHintUnavailableException()).thenReturn(
                    "Observa las casillas ocupadas en la primera fila.",
                    "Recuerda que el objetivo indica cuántas casillas deben quedar ocupadas.",
                    "¿Qué pasaría si cambiara el total de una columna?",
                    "Compara los objetivos de las filas con sus conteos actuales.");
            assertThrows(ProgressiveHintUnavailableException.class, () -> progressiveTutor.request(student, first,
                    new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 1, 6, false)));
            assertEquals(5, progressiveTutor.status(student, first).deliveredCount());
            for (int ordinal = 6; ordinal <= 8; ordinal++) {
                var hint = progressiveTutor.request(student, first,
                        new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 1, ordinal, false));
                assertEquals("GENERATIVE", hint.source());
            }
            verify(hintGenerator, times(4)).generate(argThat(context -> "tetrilogic".equals(context.game())
                    && context.diagnosis().contains("fila uno hay una casilla ocupada y el objetivo es tres")
                    && context.recentActions().contains("Intentó colocar una pieza")));

            String firstPath = "/api/v1/game-sessions/" + first + "/progressive-hints";
            requestProgressive(firstPath, new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 1, 9, false))
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("HINT_CONFIRMATION_REQUIRED"));
            assertEquals(8, progressiveTutor.status(student, first).deliveredCount());
            placeRemainingTetriPieces(first);
            assertEquals(3, sessions.complete(student, first).stars());

            var neon = startProgressiveLevel(1);
            assertEquals(0, progressiveTutor.status(student, neon.sessionId()).deliveredCount());
            String second = startTetriTutorAttempt();
            assertEquals(8, progressiveTutor.status(student, second).deliveredCount());
            var ninth = new RequestProgressiveHintCommand(UUID.randomUUID().toString(), 0, 9, true);
            assertEquals(progressiveTutor.request(student, second, ninth), progressiveTutor.request(student, second, ninth));
            sessions.action(student, second, new GameSessionAction(1, "PLACE", "i1", 3, 0, 90, null, null, null));
            placeRemainingTetriPieces(second);
            assertEquals(2, sessions.complete(student, second).stars());
            assertEquals(9, progressiveTutor.status(student, startTetriTutorAttempt()).deliveredCount());
        } finally {
            progressiveProperties.setEnabled(false);
        }
    }

    private String startTetriTutorAttempt() {
        return sessions.start(new StartGameSessionCommand(student, UUID.randomUUID().toString(), "tetrilogic",
                "tetrilogic-v2-1", "act-c002-1", null)).sessionId();
    }

    private void placeRemainingTetriPieces(String sessionId) {
        sessions.action(student, sessionId, new GameSessionAction(2, "PLACE", "s1", 0, 0, 0, null, null, null));
        sessions.action(student, sessionId, new GameSessionAction(3, "PLACE", "o1", 0, 2, 0, null, null, null));
    }

    private org.springframework.test.web.servlet.ResultActions requestProgressive(String path, RequestProgressiveHintCommand request) throws Exception {
        return mvc.perform(post(path).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(request)));
    }
    @Test void closedCatalogRejectsCreatingCoursesAndDeletingOfficialOnes() throws Exception {
        Integer before = jdbc.queryForObject("SELECT count(*) FROM courses",Integer.class);
        mvc.perform(post("/api/v1/courses").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator)
            .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Curso adicional\",\"level\":\"LOW\"}"))
            .andExpect(status().isBadRequest());
        for (String official : List.of("c001","c002")) {
            mvc.perform(delete("/api/v1/courses/"+official).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator))
                .andExpect(status().isBadRequest());
        }
        assertEquals(before,jdbc.queryForObject("SELECT count(*) FROM courses",Integer.class));
        assertEquals(2,jdbc.queryForObject("SELECT count(*) FROM courses WHERE id_course IN ('c001','c002')",Integer.class));
    }
    @Test void curriculumCrudPaginationRolesAndPartialUpdatePreserveBoard() throws Exception {
        var body=new HashMap<String,Object>();body.put("idLesson",lesson);body.put("name","Audit board");body.put("environment","neonflow");body.put("levelTemplate","neonflow-v2-2");body.put("logicLevel",2);
        mvc.perform(post("/api/v1/activities").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/activities").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isCreated()).andExpect(content().string(""));
        String activity=jdbc.queryForObject("SELECT id_activity FROM activities WHERE id_lesson=?",String.class,lesson);
        mvc.perform(put("/api/v1/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"Edited\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.levelTemplate").value("neonflow-v2-2")).andExpect(jsonPath("$.idLesson").value(lesson));
        mvc.perform(get("/api/v1/activities/lesson/"+lesson+"?page=0&size=1").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        body.put("logicLevel",99);
        mvc.perform(post("/api/v1/activities").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
        mvc.perform(delete("/api/v1/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isNotFound());
    }
    @Test void missingReferencesAndInvalidInputNeverLeavePartialRows() throws Exception {
        int before=jdbc.queryForObject("SELECT COUNT(*) FROM activity_results WHERE id_student=?",Integer.class,student);
        mvc.perform(post("/api/v1/activity-results").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idActivity","missing","score",10,"attempts",1)))).andExpect(status().isNotFound());
        assertEquals(before,jdbc.queryForObject("SELECT COUNT(*) FROM activity_results WHERE id_student=?",Integer.class,student));
        mvc.perform(post("/api/v1/module-progress").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idModule",module,"percentage",101)))).andExpect(status().isBadRequest());
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM module_progress WHERE id_student=?",Integer.class,student));
        mvc.perform(post("/api/v1/lessons").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content("{\"idModule\":\"missing\",\"title\":\"Invalid\"}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/modules").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content("{\"idCourse\":\"missing\",\"title\":\"Invalid\"}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/activities").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content("{\"idLesson\":\"missing\",\"name\":\"Invalid\",\"environment\":\"neonflow\",\"levelTemplate\":\"neonflow-v2-2\"}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/help-requests").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content("{\"idStudent\":\"missing\",\"aiInteractions\":0}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/simulations").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idActivity","missing","result","SUCCESS","blocksUsage",1)))).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/module-progress").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idModule","missing","percentage",10)))).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/group-students").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idGroup",group,"idStudent","missing")))).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/group-students").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
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
        mvc.perform(post("/api/v1/group-students").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("idGroup",group,"idStudent",student))))
                .andExpect(status().isCreated()).andExpect(content().string(""));
        assertEquals(500,jdbc.queryForObject("SELECT xp_total FROM group_students WHERE id_group=? AND id_student=?",Integer.class,group,student));
        assertEquals(9,jdbc.queryForObject("SELECT total_stars FROM group_students WHERE id_group=? AND id_student=?",Integer.class,group,student));
    }
    @Test void realAuthenticationAndOwnershipContracts() throws Exception {
        mvc.perform(get("/api/v1/daily-challenges/today/set?studentId="+student)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email",email,"password","Audit-test-only")))).andExpect(status().isOk()).andExpect(header().string("Set-Cookie",org.hamcrest.Matchers.containsString("HttpOnly")));
        mvc.perform(get("/api/v1/profile/another-student/game-progress").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/roles/user").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
    }
    @Test void removingTheLeaderReordersTheRemainingGroupRanking() throws Exception {
        String otherEmail="audit-"+UUID.randomUUID()+"@test.invalid";
        String role=jdbc.queryForObject("SELECT id_role FROM roles WHERE name='STUDENT'",String.class);
        String other=users.execute(new RegisterUserCommand("Audit","Other",otherEmail,"Audit-test-only","QA",18,List.of(role)));
        try {
            jdbc.update("INSERT INTO group_students(id_ranking,id_group,id_student,total_points,position) VALUES (?,?,?,?,?)",UUID.randomUUID().toString(),group,student,20,1);
            jdbc.update("INSERT INTO group_students(id_ranking,id_group,id_student,total_points,position) VALUES (?,?,?,?,?)",UUID.randomUUID().toString(),group,other,10,2);
            mvc.perform(delete("/api/v1/group-students/"+group+"/"+student).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator)).andExpect(status().isNoContent());
            assertEquals(1,jdbc.queryForObject("SELECT position FROM group_students WHERE id_group=? AND id_student=?",Integer.class,group,other));
            mvc.perform(delete("/api/v1/group-students/"+group+"/"+student).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator)).andExpect(status().isNoContent());
            assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM group_students WHERE id_group=?",Integer.class,group));
            mvc.perform(delete("/api/v1/group-students/missing/"+student).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator)).andExpect(status().isNoContent());
        } finally {
            jdbc.update("DELETE FROM users WHERE id_user=? AND email=?",other,otherEmail);
        }
    }
    @Test void assignmentBoundariesAndStudentRankingVisibilityAreEnforcedByTheServer() throws Exception {
        jdbc.update("UPDATE ranking_settings SET student_visibility='CLASSROOM' WHERE setting_id=1");
        rankings.execute(new AddStudentRankingCommand(group,student));
        mvc.perform(get("/api/v1/profile/"+student).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/profile/some-other-student").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/modules/course/c001").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/administration").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/administration").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/administration").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/courses").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Unauthorized\",\"level\":\"LOW\"}")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/courses").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher)).andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1)).andExpect(jsonPath("$.content[0].idCourse").value(course));
        mvc.perform(get("/api/v1/groups").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].idGroup").value(group));
        mvc.perform(get("/api/v1/rankings/global").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/rankings/settings").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content("{\"studentVisibility\":\"HIDDEN\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/group-students/"+group).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/rankings/settings").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content("{\"studentVisibility\":\"GLOBAL\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/rankings/global").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/group-students/not-my-classroom").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isForbidden());
        jdbc.update("UPDATE ranking_settings SET student_visibility='CLASSROOM' WHERE setting_id=1");
    }
    @Test void verifiedPointsImproveByTheDifferenceAndIgnoreLegacyClientScores() throws Exception {
        int previous=0,best=0;String firstSession=null;
        for(int run=0;run<3;run++) {
            var started=sessions.start(new StartGameSessionCommand(student,UUID.randomUUID().toString(),"neonflow","neonflow-v2-1",null,null));
            if(run!=1)for(int action=1;action<=20;action++)sessions.action(student,started.sessionId(),new GameSessionAction(action,action%2==1?"PLACE":"RETURN",null,1,1,null,action%2==1?"MIRROR_90":null,null,null));
            var result=sessions.complete(student,started.sessionId());assertNotNull(result.score());
            assertTrue(result.score().points()>=50&&result.score().points()<=100);
            if(run==0){firstSession=started.sessionId();previous=result.score().points();best=previous;}
            if(run==1){assertTrue(result.score().points()>previous);assertEquals(result.score().points()-previous,result.score().pointsGained());best=result.score().points();}
            if(run==2){assertEquals(0,result.score().pointsGained());assertEquals(best,result.score().bestPoints());}
            assertEquals(result,sessions.complete(student,started.sessionId()));
        }
        assertEquals(3,jdbc.queryForObject("SELECT COUNT(*) FROM game_score_receipts r JOIN verified_game_victories v ON v.session_id=r.session_id WHERE v.student_id=?",Integer.class,student));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM game_best_scores WHERE student_id=?",Integer.class,student));
        assertEquals(best,jdbc.queryForObject("SELECT SUM(best_points) FROM game_best_scores WHERE student_id=?",Integer.class,student));
        mvc.perform(get("/api/v1/profile/"+student).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.totalPoints").value(best));
        mvc.perform(post("/api/v1/activities").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("idLesson",lesson,"name","Legacy input fixture","environment","neonflow","levelTemplate","neonflow-v2-1")))).andExpect(status().isCreated());
        String activity=jdbc.queryForObject("SELECT id_activity FROM activities WHERE id_lesson=?",String.class,lesson);
        mvc.perform(post("/api/v1/activity-results").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("idStudent",student,"idActivity",activity,"score",999999,"attempts",1)))).andExpect(status().isCreated());
        rankings.execute(new AddStudentRankingCommand(group,student));
        mvc.perform(get("/api/v1/group-students/"+group).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator)).andExpect(status().isOk()).andExpect(jsonPath("$[0].totalPoints").value(best));
        assertNotNull(firstSession);
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
                assertEquals(c.slot()==5?50:0,receipt.score().dailyXpAwarded());
            }
            assertEquals(c.slot()*20,daily.today(student).progressPercent());
            assertEquals(c.slot()==5?1:0,jdbc.queryForObject("SELECT COUNT(*) FROM daily_challenge_completions WHERE student_id=?",Integer.class,student));
        }
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM game_level_progress WHERE student_id=?",Integer.class,student));
        assertEquals(5,jdbc.queryForObject("SELECT COUNT(*) FROM verified_game_victories WHERE student_id=?",Integer.class,student));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM daily_xp_ledger WHERE student_id=?",Integer.class,student));
        assertEquals(50,jdbc.queryForObject("SELECT SUM(amount) FROM daily_xp_ledger WHERE student_id=?",Integer.class,student));
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

    @Test void browserWritesRequireRealCsrfTokenAndUntrustedOriginsAreRejected() throws Exception {
        mvc.perform(post("/api/v1/auth/logout").cookie(owner)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/activity-results").cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idActivity","act-c001-v2-1","score",55,"attempts",1))))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM activity_results WHERE id_student=?",Integer.class,student));
        mvc.perform(post("/api/v1/auth/login").header("Origin","http://localhost:5173").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/auth/csrf").header("Origin","https://attacker.invalid")).andExpect(status().isForbidden());
        var response=mvc.perform(get("/api/v1/auth/csrf").cookie(owner)).andExpect(status().isOk()).andExpect(header().string("Cache-Control",org.hamcrest.Matchers.containsString("no-store"))).andReturn().getResponse();
        var token=json.readTree(response.getContentAsString());
        String xsrf=response.getHeaders("Set-Cookie").stream().filter(value->value.startsWith("XSRF-TOKEN=")).findFirst().orElseThrow();
        assertTrue(xsrf.contains("HttpOnly"));
        var csrfCookie=new Cookie("XSRF-TOKEN",xsrf.split(";",2)[0].split("=",2)[1]);
        mvc.perform(post("/api/v1/auth/logout").cookie(owner,csrfCookie).header(token.path("headerName").asText(),"invalid")).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        mvc.perform(post("/api/v1/auth/logout").cookie(owner,csrfCookie).header(token.path("headerName").asText(),token.path("token").asText())).andExpect(status().isOk()).andExpect(header().string("Set-Cookie",org.hamcrest.Matchers.containsString("Max-Age=0")));
    }

    @Test void resumeReadsOnlyMatchingActiveServerBoardAndPreservesSequence() throws Exception {
        var started=sessions.start(new StartGameSessionCommand(student,UUID.randomUUID().toString(),"neonflow","neonflow-v2-2",null,null));
        sessions.action(student,started.sessionId(),new GameSessionAction(1,"PLACE",null,1,2,0,"MIRROR_90",null,null));
        mvc.perform(get("/api/v1/game-sessions/active").cookie(owner).param("studentId",student).param("game","neonflow").param("levelTemplate","neonflow-v2-2"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.sessionId").value(started.sessionId())).andExpect(jsonPath("$.revision").value(1)).andExpect(jsonPath("$.state.pieces.length()").value(1));
        mvc.perform(get("/api/v1/game-sessions/active").cookie(owner).param("studentId",student).param("game","neonflow").param("levelTemplate","neonflow-v2-3")).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/game-sessions/active").cookie(teacher).param("studentId",student).param("game","neonflow").param("levelTemplate","neonflow-v2-2")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/game-sessions/active").cookie(owner).param("studentId",teacherId).param("game","neonflow").param("levelTemplate","neonflow-v2-2")).andExpect(status().isForbidden());
        sessions.action(student,started.sessionId(),new GameSessionAction(2,"PLACE",null,1,0,0,"MIRROR_90",null,null));
        var completed=sessions.complete(student,started.sessionId());assertEquals(completed,sessions.complete(student,started.sessionId()));
        assertTrue(sessions.active(student,"neonflow","neonflow-v2-2",null,null).isEmpty());
    }
    @Test void loginLimitSerializesConcurrentRequestsInSharedPersistence() throws Exception {
        String address="qa-rate-"+UUID.randomUUID();
        try(var pool=Executors.newFixedThreadPool(8)) {
            var jobs=new ArrayList<Callable<Integer>>();for(int i=0;i<12;i++)jobs.add(()->loginLimiter.retryAfter(address));
            var results=pool.invokeAll(jobs);int allowed=0;for(var result:results) {int retry=result.get();if(retry==0)allowed++;else assertTrue(retry>0&&retry<=60);}
            assertEquals(5,allowed);
        }
    }
    @Test void explicitPatchPreservesOtherFieldsAndRejectsNullUnknownAndIncompatibleBoard() throws Exception {
        mvc.perform(patch("/api/v1/courses/"+course).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"Patched\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Audit course")).andExpect(jsonPath("$.description").value("Patched")).andExpect(jsonPath("$.level").value("LOW"));
        mvc.perform(patch("/api/v1/courses/"+course).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Forbidden\"}")).andExpect(status().isForbidden());
        String activity=createTestActivity();
        mvc.perform(post("/api/v1/simulations").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idStudent",student,"idActivity",activity,"result","SUCCESS","blocksUsage",1)))).andExpect(status().isCreated());
        mvc.perform(patch("/api/v1/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"Updated\",\"missions\":[]}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.levelTemplate").value("neonflow-v2-2")).andExpect(jsonPath("$.missions.length()").value(0)).andExpect(jsonPath("$.idLesson").value(lesson));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM simulations WHERE id_activity=?",Integer.class,activity));
        for(String patch:List.of("{\"name\":null}","{\"idActivity\":\"new\"}","{\"environment\":\"tetrilogic\"}","{\"logicLevel\":1.5}","{\"displayOrder\":0}"))
            mvc.perform(patch("/api/v1/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content(patch)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/activities/"+activity).cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.levelTemplate").value("neonflow-v2-2")).andExpect(jsonPath("$.name").value("Retry fixture"));
    }
    private String createTestActivity() throws Exception {
        mvc.perform(post("/api/v1/activities").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idLesson",lesson,"name","Retry fixture","environment","neonflow","levelTemplate","neonflow-v2-2")))).andExpect(status().isCreated());
        return jdbc.queryForObject("SELECT id_activity FROM activities WHERE id_lesson=?",String.class,lesson);
    }
    @Test void declarationRetryKeysKeepDistinctAttemptsAndRejectChangedPayload() throws Exception {
        String activity=createTestActivity(),key=UUID.randomUUID().toString();
        String body=json.writeValueAsString(Map.of("idStudent",student,"idActivity",activity,"score",55,"attempts",1));
        try(var pool=Executors.newFixedThreadPool(4)) {
            var jobs=new ArrayList<Callable<Integer>>();for(int i=0;i<8;i++)jobs.add(()->mvc.perform(post("/api/v1/activity-results").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON).content(body)).andReturn().getResponse().getStatus());
            for(var result:pool.invokeAll(jobs))assertEquals(201,result.get());
        }
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM activity_results WHERE id_student=?",Integer.class,student));
        var changedPayload=(com.fasterxml.jackson.databind.node.ObjectNode)json.readTree(body);changedPayload.put("score",56);
        mvc.perform(post("/api/v1/activity-results").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON).content(changedPayload.toString())).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/activity-results").with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(owner).header("Idempotency-Key",UUID.randomUUID().toString()).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated());
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM activity_results WHERE id_student=?",Integer.class,student));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM game_best_scores WHERE student_id=?",Integer.class,student));
    }
    @Test void classroomActivitiesAreScopedIdempotentAndRemovalPreservesTheExercise() throws Exception {
        String activity=createTestActivity();
        administration.groupCourse(group,course,true);rankings.execute(new AddStudentRankingCommand(group,student));
        try(var pool=Executors.newFixedThreadPool(4)) {
            var jobs=new ArrayList<Callable<Void>>();for(int i=0;i<8;i++)jobs.add(()->{administration.groupActivity(group,activity,true);return null;});for(var result:pool.invokeAll(jobs))result.get();
        }
        mvc.perform(get("/api/v1/groups/"+group+"/activities?size=1").cookie(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].levelTemplate").value("neonflow-v2-2"));
        mvc.perform(put("/api/v1/groups/"+group+"/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(teacher)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/groups/foreign-classroom/activities").cookie(owner)).andExpect(status().isForbidden());
        for(int i=0;i<2;i++)mvc.perform(delete("/api/v1/groups/"+group+"/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator)).andExpect(status().isNoContent());
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM activities WHERE id_activity=?",Integer.class,activity));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM group_activities WHERE id_group=?",Integer.class,group));
        administration.groupCourse(group,course,false);
        assertThrows(com.pipre.backend.domain.exceptions.BusinessException.class,()->administration.groupActivity(group,activity,true));
    }
    @Test void tutorPilotRequiresTheExplicitActivityAssignmentForTheStudentGroup() throws Exception {
        String activity=createTestActivity();
        administration.groupCourse(group,course,true);
        rankings.execute(new AddStudentRankingCommand(group,student));
        assertFalse(tutorPilotAccess.isStudentAssignedToActivity(student,activity,Set.of(group)));
        administration.groupActivity(group,activity,true);
        assertTrue(tutorPilotAccess.isStudentAssignedToActivity(student,activity,Set.of(group)));
    }
    @Test void movingAnAssignedActivityDoesNotExposeAnotherCourseThroughTheClassroom() throws Exception {
        String activity=createTestActivity();administration.groupCourse(group,course,true);administration.groupActivity(group,activity,true);
        rankings.execute(new AddStudentRankingCommand(group,student));
        String destination=insertCourseFixture("Audit destination");
        try {
            String targetModule=modules.execute(new CreateModuleCommand(destination,"Destination module")),targetLesson=lessons.execute(new CreateLessonCommand(targetModule,"Destination lesson"));
            mvc.perform(patch("/api/v1/activities/"+activity).with(com.pipre.backend.support.BrowserRequests.csrf()).cookie(administrator).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("idLesson",targetLesson)))).andExpect(status().isOk());
            mvc.perform(get("/api/v1/groups/"+group+"/activities").cookie(teacher)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0)).andExpect(jsonPath("$.content.length()").value(0));
            mvc.perform(get("/api/v1/activities/"+activity).cookie(teacher)).andExpect(status().isForbidden());
            administration.groupCourse(group,destination,true);
            mvc.perform(get("/api/v1/groups/"+group+"/activities").cookie(teacher)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
            mvc.perform(get("/api/v1/activities/"+activity).cookie(teacher)).andExpect(status().isOk()).andExpect(jsonPath("$.levelTemplate").value("neonflow-v2-2"));
        } finally {jdbc.update("DELETE FROM courses WHERE id_course=? AND name='Audit destination'",destination);}
    }
    @Test void staffPromotionRevokesClassroomTeacherAccessToFormerStudentPrivateData() throws Exception {
        rankings.execute(new AddStudentRankingCommand(group,student));
        String activity=createTestActivity();
        var started=sessions.start(new StartGameSessionCommand(student,UUID.randomUUID().toString(),"neonflow","neonflow-v2-2",activity,null));
        var witness=generator.generate(new com.pipre.backend.application.ports.output.DailyChallengeSelectionPolicy.Specification("neonflow",2,0,0,0,0)).witness();
        int sequence=0;for(var placement:witness.path("placements"))sessions.action(student,started.sessionId(),new GameSessionAction(++sequence,"PLACE",null,placement.path("position").path("x").asInt(),placement.path("position").path("y").asInt(),placement.path("rotation").asInt(),placement.path("type").asText(),placement.path("color").asText(null),null));
        var scored=sessions.complete(student,started.sessionId());
        mvc.perform(get("/api/v1/ranking/course/"+course).cookie(teacher)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/v1/profile/"+student).cookie(teacher)).andExpect(status().isOk());
        String staffRole=jdbc.queryForObject("SELECT id_role FROM roles WHERE name='TEACHER'",String.class);
        // Preserve the old membership and STUDENT role as history; the higher role must take precedence.
        jdbc.update("INSERT INTO user_role(id_user,id_role) VALUES (?,?)",student,staffRole);
        mvc.perform(get("/api/v1/profile/"+student).cookie(teacher)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/users/"+student).cookie(teacher)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/group-students/"+group).cookie(teacher)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/v1/ranking/course/"+course).cookie(teacher)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/v1/profile/"+student).cookie(administrator)).andExpect(status().isOk()).andExpect(jsonPath("$.totalPoints").value(scored.score().bestPoints()));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM group_students WHERE id_student=? AND id_group=?",Integer.class,student,group));
    }
}
