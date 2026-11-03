package com.pipre.backend.application.useCases;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pipre.backend.application.commands.SaveAttemptCommand;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.telemetry.TelemetryAttempt;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TraceAttemptContractTest {
    private final ObjectMapper json=new ObjectMapper();
    private final SaveTelemetryPort telemetry=mock(SaveTelemetryPort.class);
    private final ActivityRepositoryPort activities=mock(ActivityRepositoryPort.class);
    private final UserRepositoryPort users=mock(UserRepositoryPort.class);
    private final SaveAttemptService service=new SaveAttemptService(telemetry,activities,users);
    @BeforeEach void setup() {
        when(users.findById("student")).thenReturn(Optional.of(mock(User.class)));
        when(activities.findById("activity")).thenReturn(Optional.of(Activity.builder().idActivity("activity").idLesson("lesson").name("Test").environment("tetrilogic").levelTemplate("tetrilogic-v2-1").difficulty("EASY").build()));
    }
    private ObjectNode trace() throws Exception { return (ObjectNode)json.readTree("""
      {"clientAttemptId":"aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee","activityId":"activity","levelTemplate":"tetrilogic-v2-1","templateVersion":2,"ruleset":"tetrilogic-counts-v1","startedAt":"2026-10-30T15:00:00Z","initialState":[],"finalState":[],"droppedEvents":0,"events":[{"sequence":1,"elapsedMs":100,"type":"CHECK","data":{"matched":true}}]}
      """); }
    private SaveAttemptCommand command(ObjectNode trace) { return new SaveAttemptCommand("student","tetrilogic","SUCCESS",1,0,0,0,"2026-10-30T15:00:01Z",trace); }
    @Test void preservesLegacyRequestsAndAddsNoInventedContext() {
        service.execute(new SaveAttemptCommand("student","neonflow","SUCCESS",1,0,0,0,"2026-10-30T15:00:01Z"));
        var capture=ArgumentCaptor.forClass(TelemetryAttempt.class);verify(telemetry).save(capture.capture());assertNull(capture.getValue().getTrace());
    }
    @Test void validatesContextAndRetriesExactlyWithoutRecheckingEditedActivity() throws Exception {
        var input=trace();service.execute(command(input));var capture=ArgumentCaptor.forClass(TelemetryAttempt.class);verify(telemetry).save(capture.capture());var saved=capture.getValue();
        assertEquals("EASY",saved.getTrace().path("difficulty").asText());assertTrue(saved.getTrace().path("clientReported").asBoolean());
        when(telemetry.findById(saved.getIdAttempt())).thenReturn(Optional.of(saved));clearInvocations(activities,telemetry);
        service.execute(command(input));verify(activities,never()).findById(anyString());verify(telemetry,never()).save(any());
        input.put("droppedEvents",1);assertThrows(BusinessException.class,()->service.execute(command(input)));
    }
    @Test void rejectsActivityTemplateMismatch() throws Exception {
        var input=trace();input.put("levelTemplate","tetrilogic-v2-30");assertThrows(BusinessException.class,()->service.execute(command(input)));verify(telemetry,never()).save(any());
    }
    @Test void rejectsUnknownStudentAndOutOfOrderEvents() throws Exception {
        var input=trace();((ObjectNode)input.path("events").get(0)).put("sequence",2);assertThrows(BusinessException.class,()->service.execute(command(input)));
        when(users.findById("student")).thenReturn(Optional.empty());assertThrows(BusinessException.class,()->service.execute(command(input)));verify(telemetry,never()).save(any());
    }
    @Test void rejectsUnexpectedPersonalDataAndNegativeEventTime() throws Exception {
        var input=trace();((ObjectNode)input.path("events").get(0)).put("email","private@example.test");assertThrows(BusinessException.class,()->service.execute(command(input)));
        var bad=trace();((ObjectNode)bad.path("events").get(0)).put("elapsedMs",-1);assertThrows(BusinessException.class,()->service.execute(command(bad)));
    }

    @ParameterizedTest
    @CsvSource(value = {
        "/templateVersion|4294967298",
        "/droppedEvents|-4294967296",
        "/droppedEvents|4294967296",
        "/events/0/sequence|4294967297",
        "/events/0/elapsedMs|18446744073709551716",
        "/events/0/data/x|4294967296",
        "/events/0/data/y|-4294967296",
        "/events/0/data/rotation|4294967296",
        "/initialState/0/x|4294967296",
        "/finalState/0/rotation|4294967296"
    }, delimiter = '|')
    void rejectsIntegersThatWouldWrapIntoAnAllowedValue(String path, String value) throws Exception {
        var input=trace();
        input.withArray("initialState").addObject().put("id","piece-1").put("type","I").put("x",0).put("y",0).put("rotation",0);
        input.withArray("finalState").addObject().put("id","piece-1").put("type","I").put("x",0).put("y",0).put("rotation",0);
        int separator=path.lastIndexOf('/');
        ((ObjectNode) input.at(path.substring(0,separator))).set(path.substring(separator+1),json.readTree(value));
        assertThrows(BusinessException.class,()->service.execute(command(input)),path+" must not be truncated before validation");
        verify(telemetry,never()).save(any());
    }

    @Test void rejectsUnrepresentableCompletedAtAsAContractError() throws Exception {
        var input=trace();
        var invalid=new SaveAttemptCommand("student","tetrilogic","SUCCESS",1,0,0,0,"+1000000000-01-01T00:00:00Z",input);
        assertThrows(BusinessException.class,()->service.execute(invalid));
        verify(telemetry,never()).save(any());
    }

    @Test void rejectsUnrepresentableElapsedDurationAsAContractError() throws Exception {
        var input=trace();input.put("startedAt","-999999999-01-01T00:00:00Z");
        assertThrows(BusinessException.class,()->service.execute(command(input)));
        verify(telemetry,never()).save(any());
    }
}
