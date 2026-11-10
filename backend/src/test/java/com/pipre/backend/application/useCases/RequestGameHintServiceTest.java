package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.commands.RequestGameHintCommand;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.NeonFlowTemplate;
import com.pipre.backend.domain.entities.activity.TetriLogicTemplate;
import com.pipre.backend.domain.entities.game.BoardRules;
import com.pipre.backend.domain.entities.game.GameSession;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.exceptions.GameHintPendingException;
import com.pipre.backend.infrastructure.configuration.TutorPilotProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RequestGameHintServiceTest {
    private final GameSessionRepositoryPort sessions = mock(GameSessionRepositoryPort.class);
    private final GameSessionHintRepositoryPort hints = mock(GameSessionHintRepositoryPort.class);
    private final TutorPilotAccessPort access = mock(TutorPilotAccessPort.class);
    private final NeonFlowTemplateRepositoryPort templates = mock(NeonFlowTemplateRepositoryPort.class);
    private final TetriLogicTemplateRepositoryPort tetriTemplates = mock(TetriLogicTemplateRepositoryPort.class);
    private final ActivityRepositoryPort activities = mock(ActivityRepositoryPort.class);
    private final AcademicAccessRepositoryPort academicAccess = mock(AcademicAccessRepositoryPort.class);
    private final TutorPilotProperties properties = new TutorPilotProperties();
    private final RequestGameHintService service = new RequestGameHintService(
            sessions, hints, new TutorPilotPolicy(properties, activities, academicAccess, access),
            templates, tetriTemplates, new ObjectMapper(), properties);
    private final GameSession session = new GameSession(
            "session", "client", "student", "neonflow", 1, "neonflow-v2-1", "activity", null,
            Instant.parse("2026-11-08T00:00:00Z"), null, "ACTIVE", BoardRules.initialState(), 0, 1, null, null);

    @BeforeEach
    void setUp() {
        properties.setEnabled(true);
        properties.setMaxHints(3);
        properties.setAllowedActivityIds(List.of("activity"));
        properties.setAllowedGroupIds(List.of("group"));
        when(sessions.lockSession("session")).thenReturn(Optional.of(session));
        Activity activity = activity();
        when(activities.findById("activity")).thenReturn(Optional.of(activity));
        when(academicAccess.activityCourse("activity")).thenReturn("c001");
        when(access.isStudentAssignedToActivity("student", "activity", Set.of("group"))).thenReturn(true);
        when(templates.findById("neonflow-v2-1")).thenReturn(Optional.of(new NeonFlowTemplate("neonflow-v2-1", 2, config())));
        when(hints.findByRequest(any(), any())).thenReturn(Optional.empty());
        when(hints.countConsumed(any())).thenReturn(0L);
        when(hints.countConsumedForDiagnosis(any(), any())).thenReturn(0L);
    }

    @Test
    void createsRuleBasedHintForAnOwnedOfficialSession() {
        var response = service.execute("student", "session", new RequestGameHintCommand(UUID.randomUUID().toString(), 0, "es"));

        assertEquals("RULE_BASED", response.source());
        assertEquals(1, response.hintLevel());
        verify(hints).save(any());
    }

    @Test
    void rejectsUnsupportedLocale() {
        assertThrows(BusinessException.class, () -> service.execute(
                "student", "session", new RequestGameHintCommand(UUID.randomUUID().toString(), 0, "en")));
        verifyNoInteractions(templates);
    }

    @Test
    void rejectsUnassignedAndForeignStudentsBeforeIssuingReceipts() {
        when(access.isStudentAssignedToActivity("student", "activity", Set.of("group"))).thenReturn(false);
        var command = new RequestGameHintCommand(UUID.randomUUID().toString(), 0, "es");
        assertThrows(BusinessException.class, () -> service.execute("student", "session", command));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.execute("other-student", "session", command));
        verifyNoInteractions(hints, templates);
    }

    @Test
    void returnsExistingReceiptBeforeCheckingNewRevision() {
        String requestId = UUID.randomUUID().toString();
        var receipt = new GameSessionHintRepositoryPort.HintReceipt(
                "hint", "session", requestId, hash(requestId + "|0|es"), "FILTER_COLOR_MISMATCH:1:1", 0,
                "es", "RULE_BASED", 1, "COLOR_HINT", "Observa el filtro.", 1, 1,
                null, null, Instant.now(), null);
        when(hints.findByRequest("session", requestId)).thenReturn(Optional.of(receipt));

        var response = service.execute("student", "session", new RequestGameHintCommand(requestId, 0, "es"));

        assertEquals("hint", response.hintId());
        verifyNoInteractions(templates);
    }

    @Test
    void tetrilogicPilotUsesItsOwnAllowlistAndReturnsTheConfirmedLine() {
        String activityId = "act-c002-1";
        String template = "tetrilogic-v2-1";
        var tetri = new GameSession("tetri", "client", "student", "tetrilogic", 1, template, activityId, null,
                Instant.now(), null, "ACTIVE", BoardRules.initialState(), 0, 1, null, null);
        when(sessions.lockSession("tetri")).thenReturn(Optional.of(tetri));
        var command = new RequestGameHintCommand(UUID.randomUUID().toString(), 0, "es");
        assertThrows(BusinessException.class, () -> service.execute("student", "tetri", command));
        verifyNoInteractions(tetriTemplates);

        properties.setEnabled(false);
        var pilot = properties.getTetrilogic();
        pilot.setEnabled(true);
        pilot.setAllowedActivityIds(List.of(activityId));
        pilot.setAllowedGroupIds(List.of("tetri-group"));
        var activity = mock(Activity.class);
        when(activities.findById(activityId)).thenReturn(Optional.of(activity));
        when(activity.getEnvironment()).thenReturn("tetrilogic");
        when(activity.getLevelTemplate()).thenReturn(template);
        when(academicAccess.activityCourse(activityId)).thenReturn("c002");
        when(access.isStudentAssignedToActivity("student", activityId, Set.of("tetri-group"))).thenReturn(true);
        when(tetriTemplates.findById(template)).thenReturn(Optional.of(new TetriLogicTemplate(template, 2, Map.of(
                "boardSize", Map.of("rows", 4, "cols", 4), "inventory", List.of(),
                "constraints", List.of(Map.of("orientation", "column", "line", 1, "targetCount", 2))))));
        when(hints.countConsumedForDiagnosis("tetri", "TETRI:column:1:0:2")).thenReturn(1L);

        var response = service.execute("student", "tetri", command);
        assertEquals("LINE_HINT", response.type());
        assertEquals(2, response.hintLevel());
        assertNull(response.targetCell());
        assertEquals("column", response.targetLine().axis());
        assertEquals(1, response.targetLine().index());
        assertTrue(response.message().contains("columna 2"));
    }

    @Test
    void countsPendingReceiptsOnlyForTheRequestedRevision() {
        when(hints.countPending(eq("session"), eq(0))).thenReturn(1L);

        assertThrows(GameHintPendingException.class, () -> service.execute(
                "student", "session", new RequestGameHintCommand(UUID.randomUUID().toString(), 0, "es")));
        verify(hints).countPending(eq("session"), eq(0));
    }

    @Test
    void rejectsDailySessionsBeforeLoadingPilotActivityData() {
        GameSession daily = new GameSession(
                "daily", "client", "student", "neonflow", 1, "neonflow-v2-1", "activity", "2026-11-09",
                Instant.parse("2026-11-08T00:00:00Z"), null, "ACTIVE", BoardRules.initialState(), 0, 1, null, null);
        when(sessions.lockSession("daily")).thenReturn(Optional.of(daily));

        assertThrows(BusinessException.class, () -> service.execute(
                "student", "daily", new RequestGameHintCommand(UUID.randomUUID().toString(), 0, "es")));
        verifyNoInteractions(activities, templates);
    }

    private Activity activity() {
        Activity activity = mock(Activity.class);
        when(activity.getIdActivity()).thenReturn("activity");
        when(activity.getIdLesson()).thenReturn("lesson");
        when(activity.getEnvironment()).thenReturn("neonflow");
        when(activity.getLevelTemplate()).thenReturn("neonflow-v2-1");
        return activity;
    }

    private Map<String, Object> config() {
        return Map.of(
                "width", 4,
                "height", 4,
                "blocked", List.of(Map.of("x", 2, "y", 2, "type", "BLOCK")),
                "receptors", List.of(Map.of("position", Map.of("x", 3, "y", 2, "type", "RECEPTOR"), "color", "red")),
                "emitter", Map.of("position", Map.of("x", 0, "y", 2, "type", "EMPTY"), "direction", Map.of("dx", 1, "dy", 0), "color", "red"));
    }

    private String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception error) { throw new IllegalStateException(error); }
    }
}
