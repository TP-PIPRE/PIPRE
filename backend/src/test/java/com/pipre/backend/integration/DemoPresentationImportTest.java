package com.pipre.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.application.dto.GameCompletionDTO;
import com.pipre.backend.application.dto.GameSessionDTO;
import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.ports.output.ProgressiveHintGeneratorPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.application.useCases.*;
import com.pipre.backend.infrastructure.configuration.ProgressiveTutorProperties;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Imports only into the private Compose database selected by scripts/demo-presentacion.ps1. */
@Tag("integration")
@EnabledIfEnvironmentVariable(named = "PIPRE_PRESENTATION_IMPORT", matches = "true")
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:postgresql://postgres:5432/pipre_audit",
    "spring.datasource.username=audit", "spring.datasource.password=audit-test-only",
    "spring.jpa.show-sql=false", "pipre.seed.demo-data=false"
})
@AutoConfigureMockMvc
class DemoPresentationImportTest {
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final String METRICS = "/api/v1/educational-metrics";
    private static final List<String> SIMULATED_HINTS = List.of(
            "Observa el primer tramo del haz y revisa qué elemento cambia su recorrido. [Simulación de IA]",
            "El color debe coincidir con el receptor para que la trayectoria sea válida. [Simulación de IA]",
            "¿Qué ocurriría si el haz cambiara de dirección antes del obstáculo? [Simulación de IA]",
            "Compara la trayectoria obtenida con la que esperabas al orientar el espejo. [Simulación de IA]",
            "Sigue el haz desde el emisor hasta el punto donde se detiene. [Simulación de IA]",
            "Explica cuál fue el último componente que cambió la trayectoria. [Simulación de IA]"
    );

    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired MockMvc mvc;
    @Autowired DemoClock clock;
    @Autowired RegisterUserService register;
    @Autowired UserRepositoryPort users;
    @Autowired AcademicAdministrationService administration;
    @Autowired AddStudentRankingService memberships;
    @Autowired GameSessionsService sessions;
    @Autowired ProgressiveTutorService tutor;
    @Autowired ProgressiveTutorProperties tutorProperties;
    @MockitoBean ProgressiveHintGeneratorPort generator;
    private int loginClient;

    record Metadata(String id, String tipo, String nota, String fuente, String zona) {}
    record Classroom(String name, String description, List<String> courseIds) {}
    record Credentials(String password) {}
    record Account(String firstName, String lastName, String email, int age, String grade, String profile, List<Attempt> attempts) {}
    record Attempt(String key, String game, String levelTemplate, String activityId, int daysAgo, int startMinute,
                   int durationSeconds, boolean complete, boolean progressive, int progressiveHints, List<GameSessionAction> actions) {}
    record Manifest(Metadata metadata, Classroom classroom, Credentials credentials, Account administrator, Account teacher, List<Account> students) {}
    record Exercise(String game, String template) {}
    record LearnerResult(int attempts, int initiated, int completed, int attemptsUntilSolved, int activeDays,
                         int closedSessions, long closedSeconds, int stars, int points, int achievements,
                         int fixed, int generated, int extra, Map<String, Integer> levels) {}

    @Test void importPresentationWithVerifiedActionsAndReconcileMetrics() throws Exception {
        assertEquals("pipre_audit", jdbc.queryForObject("SELECT current_database()", String.class));
        Manifest manifest = json.readValue(Path.of("/fixtures/seed_simulador_demo.json").toFile(), Manifest.class);
        LocalDate anchor = LocalDate.parse(System.getenv("PIPRE_PRESENTATION_ANCHOR"));
        validate(manifest, anchor);
        when(generator.generate(any())).thenAnswer(call -> {
            ProgressiveHintGeneratorPort.Context context = call.getArgument(0);
            return SIMULATED_HINTS.stream().filter(message -> !context.repeatsAdvice(message)).findFirst().orElseThrow();
        });
        String password = manifest.credentials().password();
        String admin = account(manifest.administrator(), password, "ADMIN");
        String teacher = account(manifest.teacher(), password, "TEACHER");
        Cookie adminCookie = login(manifest.administrator(), password, admin);
        Cookie teacherCookie = login(manifest.teacher(), password, teacher);
        String group = classroom(manifest.classroom(), teacher);

        Map<Account, String> roster = new LinkedHashMap<>();
        for (Account student : manifest.students()) {
            String id = account(student, password, "STUDENT");
            memberships.execute(new AddStudentRankingCommand(group, id));
            roster.put(student, id);
        }

        Map<Account, LearnerResult> first = replay(manifest.metadata().id(), roster, anchor);
        assertEquals(first, replay(manifest.metadata().id(), roster, anchor), "reimport keeps every receipt and result");
        String[] studentIds = roster.values().toArray(String[]::new);
        int expectedAttempts = first.values().stream().mapToInt(LearnerResult::attempts).sum();
        assertEquals(expectedAttempts, countForRoster("game_sessions", studentIds));
        assertEquals(first.values().stream().mapToInt(LearnerResult::completed).sum(), countForRoster("verified_game_victories", studentIds));
        assertEquals(first.values().stream().mapToInt(LearnerResult::achievements).sum(), countForRoster("achievement_xp_ledger", studentIds));

        JsonNode teacherReport = metrics(teacherCookie, group, "", "", anchor);
        assertEquals(teacherReport, metrics(adminCookie, group, "", "", anchor));
        JsonNode institution = metrics(adminCookie, "", "", "", anchor).path("summary");
        assertEquals(teacherReport.path("summary").path("stars"), institution.path("stars"));
        assertEquals(teacherReport.path("summary").path("completed"), institution.path("completed"));
        checkSummary(teacherReport, first.values());
        assertEquals(12, teacherReport.path("students").size());
        assertTrue(teacherReport.path("timeline").size() > 6);
        Map<String, String> tags = new HashMap<>();
        try (var catalog = getClass().getResourceAsStream("/catalog/tetrilogic-v2.json")) {
            for (JsonNode board : json.readTree(catalog)) tags.put(board.path("templateId").asText(), board.path("cognitiveDimension").asText());
        }
        for (JsonNode dimension : teacherReport.path("dimensions")) {
            String label = dimension.path("dimension").asText();
            long wins = roster.keySet().stream().flatMap(student -> student.attempts().stream())
                    .filter(attempt -> attempt.complete() && label.equals(tags.get(attempt.levelTemplate()))).count();
            assertTrue(wins > 0, label);
            assertEquals(wins, dimension.path("solved").asLong(), label);
        }
        for (String game : manifest.classroom().courseIds()) {
            String environment = game.equals("c001") ? "neonflow" : "tetrilogic";
            int levels = first.values().stream().mapToInt(result -> result.levels().getOrDefault(environment, 0)).sum();
            JsonNode courseReport = metrics(teacherCookie, group, "", environment, anchor);
            assertEquals(levels, courseReport.path("summary").path("completed").asInt());
            assertEquals(100.0 * levels / (30 * roster.size()), courseReport.path("courses").get(0).path("progress").asDouble(), 0.001);
        }
        for (var entry : roster.entrySet()) {
            Cookie studentCookie = login(entry.getKey(), password, entry.getValue());
            LearnerResult result = first.get(entry.getKey());
            checkSummary(metrics(teacherCookie, group, entry.getValue(), "", anchor), List.of(result));
            mvc.perform(get("/api/v1/profile/{id}/game-progress", entry.getValue()).cookie(studentCookie))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.completedLevels").value(result.completed()))
                    .andExpect(jsonPath("$.totalStars").value(result.stars()));
            mvc.perform(get("/api/v1/profile/{id}", entry.getValue()).cookie(studentCookie))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalPoints").value(result.points()));
        }
        mvc.perform(get(METRICS).param("group", UUID.randomUUID().toString()).cookie(teacherCookie)).andExpect(status().isForbidden());
        mvc.perform(get(METRICS + "/options").cookie(teacherCookie)).andExpect(status().isOk())
                .andExpect(jsonPath("$.groups.length()").value(1)).andExpect(jsonPath("$.students.length()").value(12));
        System.out.println("PIPRE_PRESENTATION_SUMMARY " + teacherReport.path("summary"));
        System.out.println("PIPRE_PRESENTATION_TUTOR " + teacherReport.path("tutor"));
        System.out.println("PIPRE_PRESENTATION_COURSES " + teacherReport.path("courses"));
    }

    private void validate(Manifest manifest, LocalDate anchor) {
        assertEquals("DEMOSTRACION_SINTETICA", manifest.metadata().tipo());
        assertEquals(LIMA.getId(), manifest.metadata().zona());
        assertTrue(manifest.classroom().name().startsWith("[DEMO]"));
        assertEquals(List.of("c001", "c002"), manifest.classroom().courseIds());
        assertEquals(12, manifest.students().size());
        Set<String> emails = new HashSet<>();
        Set<String> keys = new HashSet<>();
        for (Account account : java.util.stream.Stream.concat(
                java.util.stream.Stream.of(manifest.administrator(), manifest.teacher()), manifest.students().stream()).toList()) {
            assertTrue(account.email().endsWith("@pipre.test") && emails.add(account.email()));
            assertTrue(account.lastName().endsWith("[DEMO]"));
            Instant previousEnd = Instant.MIN;
            if (account.attempts() == null) continue;
            for (Attempt attempt : account.attempts()) {
                assertTrue(keys.add(attempt.key()));
                assertTrue(attempt.daysAgo() >= 1 && attempt.daysAgo() < 30 && attempt.durationSeconds() > 0);
                Instant start = startAt(anchor, attempt);
                assertFalse(start.isBefore(previousEnd), attempt.key());
                previousEnd = start.plusSeconds(attempt.durationSeconds());
                assertTrue(attempt.progressiveHints() >= 0 && attempt.progressiveHints() <= 11);
                assertTrue(attempt.progressive() || attempt.progressiveHints() == 0);
                assertFalse(attempt.actions().isEmpty());
                for (int i = 0; i < attempt.actions().size(); i++) assertEquals(i + 1, attempt.actions().get(i).sequence());
            }
        }
    }

    private String account(Account account, String password, String role) {
        String roleId = jdbc.queryForObject("SELECT id_role FROM roles WHERE name=?", String.class, role);
        return users.findByEmail(account.email()).map(existing -> {
            assertEquals(account.firstName(), existing.getFirstName());
            assertEquals(account.lastName(), existing.getLastName());
            assertEquals(List.of(roleId), existing.getIdRoleList());
            return existing.getIdUser();
        }).orElseGet(() -> register.execute(new RegisterUserCommand(account.firstName(), account.lastName(), account.email(),
                password, account.grade(), account.age(), List.of(roleId))));
    }

    private Cookie login(Account account, String password, String id) throws Exception {
        String client = "192.0.2." + ++loginClient;
        String header = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .with(request -> { request.setRemoteAddr(client); return request; })
                        .content(json.writeValueAsString(Map.of("email", account.email(), "password", password))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.idUser").value(id))
                .andReturn().getResponse().getHeader("Set-Cookie");
        assertNotNull(header);
        assertTrue(header.startsWith("jwt="));
        return new Cookie("jwt", header.split(";", 2)[0].substring(4));
    }

    private String classroom(Classroom classroom, String teacher) {
        List<GroupDTO> matches = administration.snapshot().groups().stream().filter(group -> classroom.name().equals(group.groupName())).toList();
        assertTrue(matches.size() <= 1);
        GroupDTO group = matches.isEmpty() ? administration.createGroup(classroom.name(), classroom.description()) : matches.get(0);
        assertEquals(classroom.description(), group.description());
        administration.teacherGroup(teacher, group.idGroup(), true);
        for (String course : classroom.courseIds()) {
            administration.teacherCourse(teacher, course, true);
            administration.groupCourse(group.idGroup(), course, true);
        }
        return group.idGroup();
    }

    private Map<Account, LearnerResult> replay(String seed, Map<Account, String> roster, LocalDate anchor) throws Exception {
        Map<Account, LearnerResult> results = new LinkedHashMap<>();
        for (var row : roster.entrySet()) {
            List<Attempt> attempts = row.getKey().attempts();
            Map<Exercise, Integer> initiated = new HashMap<>();
            Set<Integer> days = new HashSet<>();
            Map<String, Integer> levels = new HashMap<>();
            int stars = 0, points = 0, fixed = 0, generated = 0, extra = 0;
            int solvedAttempts = 0, closed = 0;
            long seconds = 0;
            for (int index = 0; index < attempts.size(); index++) {
                Attempt attempt = attempts.get(index);
                int rank = initiated.merge(new Exercise(attempt.game(), attempt.levelTemplate()), 1, Integer::sum);
                days.add(attempt.daysAgo());
                fixed += (int) attempt.actions().stream().filter(action -> action.type().equals("HELP")).count() + Math.min(5, attempt.progressiveHints());
                generated += Math.max(0, attempt.progressiveHints() - 5);
                extra += Math.max(0, attempt.progressiveHints() - 8);
                var result = play(seed, row.getValue(), attempt, anchor);
                if (result != null) {
                    solvedAttempts += rank;
                    closed++;
                    seconds += attempt.durationSeconds();
                    levels.merge(attempt.game(), 1, Integer::sum);
                    stars += result.stars();
                    points += result.score().points();
                } else if (index + 1 < attempts.size()) {
                    closed++;
                    seconds += Duration.between(startAt(anchor, attempt), startAt(anchor, attempts.get(index + 1))).toSeconds();
                }
            }
            int neon = levels.getOrDefault("neonflow", 0), tetri = levels.getOrDefault("tetrilogic", 0);
            results.put(row.getKey(), new LearnerResult(attempts.size(), initiated.size(), neon + tetri, solvedAttempts, days.size(),
                    closed, seconds, stars, points, Math.min(neon, tetri), fixed, generated, extra, levels));
        }
        return results;
    }

    private GameCompletionDTO play(String seed, String student, Attempt attempt, LocalDate anchor) throws Exception {
        Instant start = startAt(anchor, attempt);
        clock.set(start);
        tutorProperties.setEnabled(attempt.progressive());
        String client = stableId(seed + ":" + attempt.key());
        var session = sessions.start(new StartGameSessionCommand(student, client, attempt.game(), attempt.levelTemplate(), attempt.activityId(), null));
        if ("ACTIVE".equals(session.status())) {
            assertEquals(attempt.progressive(), session.state().path("neonFlowProgressiveTutor").asBoolean());
            boolean adviceReady = !attempt.progressive();
            for (GameSessionAction action : attempt.actions()) {
                clock.set(start.plusSeconds((long) action.sequence() * attempt.durationSeconds() / (attempt.actions().size() + 1)));
                if (!adviceReady && action.type().equals("PLACE")) {
                    giveAdvice(student, session, client, attempt.progressiveHints());
                    adviceReady = true;
                }
                if (session.revision() >= action.sequence()) continue;
                session = sessions.action(student, session.sessionId(), action);
                assertFalse(session.state().path("lastActionRejected").asBoolean(), attempt.key() + " " + action);
            }
        }
        if (!attempt.complete()) {
            assertNotEquals("COMPLETED", session.status());
            return null;
        }
        assertNotEquals("ABANDONED", session.status(), attempt.key());
        clock.set(start.plusSeconds(attempt.durationSeconds()));
        var result = sessions.complete(student, session.sessionId());
        assertEquals(attempt.durationSeconds() * 1000L, result.durationMs(), attempt.key());
        checkAward(attempt, result);
        return result;
    }

    private void giveAdvice(String student, GameSessionDTO session, String client, int count) {
        int next = tutor.status(student, session.sessionId()).deliveredCount() + 1;
        for (int ordinal = next; ordinal <= count; ordinal++) {
            var request = new RequestProgressiveHintCommand(stableId(client + ":hint:" + ordinal), session.revision(), ordinal, ordinal > 8);
            var delivered = tutor.request(student, session.sessionId(), request);
            assertEquals(ordinal, delivered.ordinal());
            assertEquals(ordinal <= 5 ? "STATIC" : "GENERATIVE", delivered.source());
            if (ordinal > 5) assertTrue(delivered.message().contains("Simulación de IA"));
        }
    }

    private void checkAward(Attempt attempt, GameCompletionDTO result) throws Exception {
        boolean neon = attempt.game().equals("neonflow");
        String table = neon ? "neonflow_templates" : "tetrilogic_templates";
        JsonNode board = json.readTree(jdbc.queryForObject("SELECT config FROM " + table + " WHERE template_id=?", String.class, attempt.levelTemplate()));
        int limit = neon ? 2 * (board.path("width").asInt() + board.path("height").asInt()) : 4 * board.path("inventory").size();
        long resets = attempt.actions().stream().filter(action -> action.type().equals("RESET")).count();
        long checks = attempt.actions().stream().filter(action -> action.type().equals("CHECK")).count();
        var placements = attempt.actions().stream().filter(action -> action.type().equals("PLACE")).toList();
        long helps = attempt.actions().stream().filter(action -> action.type().equals("HELP")).count() + Math.max(0, attempt.progressiveHints() - 8);
        int expected = 1;
        if (resets <= 2 && helps <= 2 && placements.size() <= 2 * limit) expected = 2;
        if (resets <= 1 && helps <= 1 && checks <= 2 && 2 * placements.size() <= 3 * limit) expected = 3;
        assertEquals(expected, result.stars(), attempt.key());
        int reference = placements.stream().mapToInt(action -> 1 + action.rotation() / 90).sum();
        int expectedPoints = 50 + 30 * reference / Math.max(reference, placements.size())
                + 3600 / (180 + attempt.durationSeconds());
        assertEquals(expectedPoints, result.score().points(), attempt.key());
    }

    private JsonNode metrics(Cookie cookie, String group, String student, String game, LocalDate anchor) throws Exception {
        return json.readTree(mvc.perform(get(METRICS).cookie(cookie).param("group", group).param("student", student)
                .param("game", game).param("from", anchor.minusDays(29).toString()).param("to", anchor.toString()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private void checkSummary(JsonNode report, Collection<LearnerResult> results) {
        JsonNode summary = report.path("summary"), help = report.path("tutor");
        int completed = results.stream().mapToInt(LearnerResult::completed).sum();
        int initiated = results.stream().mapToInt(LearnerResult::initiated).sum();
        assertEquals(results.size(), summary.path("active").asInt());
        assertEquals(results.stream().mapToInt(LearnerResult::attempts).sum(), summary.path("sessions").asInt());
        assertEquals(completed, summary.path("completed").asInt());
        assertEquals(initiated, summary.path("initiated").asInt());
        assertEquals(100.0 * completed / initiated, summary.path("completionRate").asDouble(), 0.001);
        assertEquals(results.stream().mapToDouble(LearnerResult::attemptsUntilSolved).sum() / completed, summary.path("averageAttempts").asDouble(), 0.001);
        assertEquals(results.stream().mapToDouble(LearnerResult::activeDays).average().orElseThrow(), summary.path("averageActiveDays").asDouble(), 0.001);
        assertEquals(results.stream().mapToDouble(LearnerResult::closedSeconds).sum() / results.stream().mapToInt(LearnerResult::closedSessions).sum(),
                summary.path("averageSessionSeconds").asDouble(), 0.001);
        int stars = results.stream().mapToInt(LearnerResult::stars).sum();
        int achievements = results.stream().mapToInt(LearnerResult::achievements).sum();
        assertEquals(stars, summary.path("stars").asInt());
        assertEquals(achievements, summary.path("achievements").asInt());
        assertEquals((double) stars / results.size(), summary.path("averageStars").asDouble(), 0.001);
        assertEquals((double) achievements / results.size(), summary.path("averageAchievements").asDouble(), 0.001);
        assertEquals(results.stream().mapToInt(LearnerResult::fixed).sum(), help.path("fixed").asInt());
        assertEquals(results.stream().mapToInt(LearnerResult::generated).sum(), help.path("generated").asInt());
        assertEquals(results.stream().mapToInt(LearnerResult::extra).sum(), help.path("extra").asInt());
        assertEquals(results.stream().filter(result -> result.generated() > 0).count(), help.path("studentsUsingAi").asLong());
        assertEquals(results.stream().filter(result -> result.extra() > 0).count(), help.path("studentsOverFreeLimit").asLong());
    }

    private int countForRoster(String table, String[] ids) {
        String placeholders = String.join(",", Collections.nCopies(ids.length, "?"));
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE student_id IN (" + placeholders + ")", Integer.class, (Object[]) ids);
    }

    private static Instant startAt(LocalDate anchor, Attempt attempt) {
        return anchor.minusDays(attempt.daysAgo()).atStartOfDay(LIMA).plusMinutes(attempt.startMinute()).toInstant();
    }

    private static String stableId(String key) {
        return UUID.nameUUIDFromBytes(key.getBytes(StandardCharsets.UTF_8)).toString();
    }

    @TestConfiguration
    static class DemoClockConfiguration {
        @Bean @Primary DemoClock presentationClock() { return new DemoClock(); }
    }

    static class DemoClock extends Clock {
        private Instant instant = Instant.now();
        void set(Instant value) { instant = value; }
        @Override public Instant instant() { return instant; }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(instant, zone); }
    }
}
