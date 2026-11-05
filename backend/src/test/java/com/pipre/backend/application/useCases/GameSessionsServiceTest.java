package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.ports.input.*;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.activity.NeonFlowTemplate;
import com.pipre.backend.domain.entities.game.*;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GameSessionsServiceTest {
    private final ObjectMapper json=new ObjectMapper();
    private final MemorySessions repository=new MemorySessions();
    private final NeonFlowTemplateRepositoryPort templates=mock(NeonFlowTemplateRepositoryPort.class);
    private final ActivityRepositoryPort activities=mock(ActivityRepositoryPort.class);
    private final DailyChallengeUseCase daily=mock(DailyChallengeUseCase.class);
    private final RecordVerifiedVictoryUseCase victories=mock(RecordVerifiedVictoryUseCase.class);
    private final MutableClock clock=new MutableClock();
    private final GameSessionsService service=new GameSessionsService(repository,mock(TetriLogicTemplateRepositoryPort.class),templates,activities,daily,victories,json,clock,mock(ProceduralDailyService.class));
    @BeforeEach void setup() throws Exception {
        JsonNode catalog=json.readTree(getClass().getResourceAsStream("/catalog/neonflow-v2.json"));
        for(JsonNode config:catalog) {
            String template=config.path("templateId").asText();
            when(templates.findById(template)).thenReturn(Optional.of(new NeonFlowTemplate(template,2,json.convertValue(config,Map.class))));
        }
        when(victories.execute(any())).thenReturn(new VictoryAwardsDTO(3,List.of(),null));
    }
    private StartGameSessionCommand command(int level) { return new StartGameSessionCommand("student",UUID.randomUUID().toString(),"neonflow","neonflow-v2-"+level,null,null); }
    @Test void usesServerTimeAndNeverAcceptsClientOutcomeStarsOrDuration() {
        var started=service.start(command(1));clock.now=clock.now.plusSeconds(179);
        var completed=service.complete("student",started.sessionId());
        assertEquals(179000,completed.durationMs());assertEquals(3,completed.stars());
        var capture=ArgumentCaptor.forClass(VerifiedVictory.class);verify(victories).execute(capture.capture());
        assertEquals(Instant.parse(started.startedAt()),capture.getValue().startedAt());assertEquals(clock.now,capture.getValue().completedAt());
        assertEquals("COMPLETED",repository.rows.get(started.sessionId()).status());
        assertEquals(completed,service.complete("student",started.sessionId()));verify(victories,times(1)).execute(any());
    }
    @Test void rejectsUnsolvedAndAnotherStudentsSession() {
        var session=service.start(command(2));
        assertThrows(BusinessException.class,()->service.complete("student",session.sessionId()));
        assertEquals(1,repository.rows.get(session.sessionId()).state().path("failedChecks").asInt());
        assertEquals("ACTIVE",repository.rows.get(session.sessionId()).status());
        repository.locks.clear();
        assertThrows(AccessDeniedException.class,()->service.complete("other",session.sessionId()));
        assertEquals(List.of("student:other","session:"+session.sessionId()),repository.locks);verifyNoInteractions(victories);
    }
    @Test void startsAreIdempotentAndNeverResurrectCompletedOrAbandonedSessions() {
        var firstCommand=command(1);var first=service.start(firstCommand);
        assertEquals(first,service.start(firstCommand));assertEquals(1,repository.rows.size());
        service.complete("student",first.sessionId());assertEquals("COMPLETED",service.start(firstCommand).status());
        var secondCommand=command(2);var second=service.start(secondCommand);clock.now=clock.now.plusSeconds(1);
        var third=service.start(command(3));
        assertEquals("ABANDONED",service.start(secondCommand).status());assertEquals("ACTIVE",third.status());
        assertNotNull(repository.rows.get(second.sessionId()).completedAt());
        assertTrue(repository.rows.get(third.sessionId()).startedOrder()>repository.rows.get(second.sessionId()).startedOrder());
    }
    @Test void sequencesAndContentAreIdempotentAndTechnicalRejectionsDoNotBlockTheQueue() {
        var session=service.start(command(1));
        var invalid=new GameSessionAction(1,"PLACE",null,-100,0,0,"MIRROR_90",null,null);
        var rejected=service.action("student",session.sessionId(),invalid);
        assertEquals(1,rejected.revision());assertTrue(rejected.state().path("lastActionRejected").asBoolean());
        assertEquals(rejected,service.action("student",session.sessionId(),invalid));
        assertThrows(BusinessException.class,()->service.action("student",session.sessionId(),new GameSessionAction(1,"RESET",null,null,null,null,null,null,null)));
        assertThrows(BusinessException.class,()->service.action("student",session.sessionId(),new GameSessionAction(3,"CHECK",null,null,null,null,null,null,null)));
        assertEquals(2,service.action("student",session.sessionId(),new GameSessionAction(2,"CHECK",null,null,null,null,null,null,null)).revision());
        assertEquals(1,repository.rows.get(session.sessionId()).state().path("rejections").asInt());
    }
    @Test void serverCountersReduceStarsAndClockRegressionCannotProduceAFastVictory() {
        var session=service.start(command(1));
        service.action("student",session.sessionId(),new GameSessionAction(1,"HELP",null,null,null,null,null,null,"STATIC"));
        service.action("student",session.sessionId(),new GameSessionAction(2,"RESET",null,null,null,null,null,null,null));
        clock.now=clock.now.minusSeconds(1);
        assertThrows(BusinessException.class,()->service.complete("student",session.sessionId()));verifyNoInteractions(victories);
        clock.now=clock.now.plusSeconds(2);assertEquals(2,service.complete("student",session.sessionId()).stars());
    }
    @Test void validatesDailyAssignmentOnStartAndRetainsCanonicalLevelIdentity() {
        var request=new StartGameSessionCommand("student",UUID.randomUUID().toString(),"neonflow","neonflow-3",null,"2026-11-02");
        var session=service.start(request);assertEquals("neonflow-v2-3",session.levelTemplate());assertEquals(3,session.levelNumber());
        verify(daily).validate("student","2026-11-02","neonflow","neonflow-v2-3");
        var reused=new StartGameSessionCommand("student",request.clientSessionId(),"neonflow","neonflow-v2-4",null,"2026-11-02");
        assertThrows(BusinessException.class,()->service.start(reused));
    }
    @Test void failedCompletionProbeReducesStarsUntilANewCleanSession() {
        var session=service.start(command(2));
        assertThrows(BusinessException.class,()->service.complete("student",session.sessionId()));
        service.action("student",session.sessionId(),new GameSessionAction(1,"PLACE",null,1,2,0,"MIRROR_90",null,null));
        service.action("student",session.sessionId(),new GameSessionAction(2,"PLACE",null,1,0,0,"MIRROR_90",null,null));
        assertEquals(2,service.complete("student",session.sessionId()).stars());
        var clean=service.start(command(2));
        service.action("student",clean.sessionId(),new GameSessionAction(1,"PLACE",null,1,2,0,"MIRROR_90",null,null));
        service.action("student",clean.sessionId(),new GameSessionAction(2,"PLACE",null,1,0,0,"MIRROR_90",null,null));
        assertEquals(3,service.complete("student",clean.sessionId()).stars());
    }
    private static final class MutableClock extends Clock {
        Instant now=Instant.parse("2026-11-02T12:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return now;}
    }
    private static final class MemorySessions implements GameSessionRepositoryPort {
        Map<String,GameSession> rows=new LinkedHashMap<>();Map<String,ActionReceipt> actions=new HashMap<>();List<String> locks=new ArrayList<>();long order=0;
        public void lockStudent(String student){locks.add("student:"+student);}
        public Optional<GameSession> findByClientId(String student,String client){return rows.values().stream().filter(s->s.studentId().equals(student)&&s.clientSessionId().equals(client)).findFirst();}
        public Optional<GameSession> lockSession(String id){locks.add("session:"+id);return Optional.ofNullable(rows.get(id));}
        public void abandonActive(String student,Instant now){new ArrayList<>(rows.values()).stream().filter(s->s.studentId().equals(student)&&s.status().equals("ACTIVE")).forEach(s->update(s.change(s.state(),s.revision(),"ABANDONED",now,null,null)));}
        public GameSession insert(GameSession s){var inserted=new GameSession(s.sessionId(),s.clientSessionId(),s.studentId(),s.game(),s.levelNumber(),s.levelTemplate(),s.activityId(),s.dailyChallengeId(),s.startedAt(),s.completedAt(),s.status(),s.state(),s.revision(),++order,s.stars(),s.completionResponse());rows.put(s.sessionId(),inserted);return inserted;}
        public void update(GameSession s){rows.put(s.sessionId(),s);}
        public Optional<ActionReceipt> findAction(String id,int sequence){return Optional.ofNullable(actions.get(id+":"+sequence));}
        public void saveAction(String id,int sequence,String hash,JsonNode payload,Instant received,JsonNode response){actions.put(id+":"+sequence,new ActionReceipt(hash,response));}
    }
}
