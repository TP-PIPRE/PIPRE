package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.application.ports.output.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:procedural_daily;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.show-sql=false","spring.flyway.placeholders.telemetry_fk_validation="})
class ProceduralDailyTest {
    @Autowired ProceduralDailyService daily;
    @Autowired ProceduralDailyGenerator generator;
    @Autowired GameSessionsService sessions;
    @Autowired DailySetRepositoryPort sets;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean Clock clock;
    @MockitoBean DailyChallengeSelectionPolicy policy;
    String student;
    static final List<DailyChallengeSelectionPolicy.Specification> SPECS=List.of(
        new DailyChallengeSelectionPolicy.Specification("neonflow",2,1,1,1,0),
        new DailyChallengeSelectionPolicy.Specification("tetrilogic",1,2,1,0,1),
        new DailyChallengeSelectionPolicy.Specification("neonflow",12,1,2,1,1),
        new DailyChallengeSelectionPolicy.Specification("tetrilogic",20,1,1,1,1),
        new DailyChallengeSelectionPolicy.Specification("tetrilogic",30,2,2,1,0));
    void time(String instant) {
        Instant at=Instant.parse(instant);when(clock.instant()).thenReturn(at);
        doAnswer(i->Clock.fixed(at,i.getArgument(0))).when(clock).withZone(any());
    }
    @BeforeEach void setup() {
        student=jdbc.queryForObject("SELECT id_user FROM users WHERE email='alumno@pipre.com'",String.class);
        time("2030-01-01T12:00:00Z");when(policy.select(anyString(),any())).thenReturn(SPECS);
        jdbc.update("DELETE FROM procedural_daily_sets WHERE student_id=?",student);
        jdbc.update("DELETE FROM daily_challenge_completions WHERE student_id=?",student);
    }
    @ParameterizedTest @ValueSource(ints={0,1,2}) void allSixtyBasesRemainSolvableUnderPadding(int offset) {
        for(String game:List.of("neonflow","tetrilogic"))for(int level=1;level<=30;level++) {
            var generated=generator.generate(new DailyChallengeSelectionPolicy.Specification(game,level,offset,2-offset,offset,1));
            assertNotNull(generated.config());assertNotNull(generated.witness());
        }
    }
    @Test void fiveStableSnapshotsRenewAtLimaMidnightAndRejectForeignIds() {
        time("2030-01-02T04:59:59Z");var first=daily.today(student);
        assertEquals(5,first.challenges().size());assertEquals(first,daily.today(student));
        assertEquals(5,first.challenges().stream().map(c->c.id()).distinct().count());
        assertEquals("2030-01-01",first.date());assertEquals("2030-01-02T05:00:00Z",first.expiresAt());
        var c=first.challenges().get(0);
        assertThrows(RuntimeException.class,()->daily.config("other",c.id(),c.game(),c.levelTemplate(),true));
        time("2030-01-02T05:00:00Z");var next=daily.today(student);
        assertEquals("2030-01-02",next.date());assertNotEquals(first.challenges().get(0).id(),next.challenges().get(0).id());
        assertThrows(RuntimeException.class,()->daily.config(student,c.id(),c.game(),c.levelTemplate(),true));
        assertEquals(c.config(),daily.config(student,c.id(),c.game(),c.levelTemplate(),false));
    }
    @Test void parallelReadsCreateExactlyOneSet() throws Exception {
        try(var pool=Executors.newFixedThreadPool(4)) {
            var jobs=new ArrayList<Callable<ProceduralDailyService.DailySet>>();for(int i=0;i<8;i++)jobs.add(()->daily.today(student));
            var results=pool.invokeAll(jobs);var first=results.get(0).get();
            for(var result:results)assertEquals(first,result.get());
            assertEquals(5,jdbc.queryForObject("SELECT COUNT(*) FROM procedural_daily_challenges WHERE student_id=?",Integer.class,student));
        }
    }
    @Test void onlyFiveVerifiedExercisesCompleteTheDailyAndPersistAcrossReloads() {
        var initial=daily.today(student);
        assertEquals(0,initial.progressPercent());assertEquals("PENDING",initial.status());
        var future=initial.challenges().get(1);
        assertThrows(RuntimeException.class,()->sessions.start(new StartGameSessionCommand(student,UUID.randomUUID().toString(),future.game(),future.levelTemplate(),null,future.id())));
        int before=jdbc.queryForObject("SELECT COUNT(*) FROM game_level_progress WHERE student_id=?",Integer.class,student);
        for(int index=0;index<5;index++) {
        var c=daily.today(student).challenges().get(index);
        var session=sessions.start(new StartGameSessionCommand(student,UUID.randomUUID().toString(),c.game(),c.levelTemplate(),null,c.id()));
        assertEquals("IN_PROGRESS",daily.today(student).challenges().get(index).status());
        if(generator.generate(SPECS.get(index)).witness().path("placements").size()>0)assertThrows(RuntimeException.class,()->sessions.complete(student,session.sessionId()));
        int sequence=0;
        for(var p:generator.generate(SPECS.get(index)).witness().path("placements")) {
            sessions.action(student,session.sessionId(),new GameSessionAction(++sequence,"PLACE",p.path("id").asText(null),p.path("position").path("x").asInt(),p.path("position").path("y").asInt(),p.path("rotation").asInt(),p.path("type").asText(null),p.path("color").asText(null),null));
        }
        var receipt=sessions.complete(student,session.sessionId());assertEquals(receipt,sessions.complete(student,session.sessionId()));
        var reloaded=daily.today(student).challenges().get(index);assertNotNull(reloaded.completedAt());assertTrue(reloaded.bestStars()>0);
        var summary=daily.today(student);
        assertEquals(index+1,summary.completedCount());assertEquals((index+1)*20,summary.progressPercent());
        assertEquals(index==4,summary.completed());assertEquals(index==4,receipt.daily().completed());
        assertEquals(index==4?"COMPLETED":"IN_PROGRESS",summary.status());
        assertEquals("COMPLETED",reloaded.status());
        assertEquals(index==4?1:0,jdbc.queryForObject("SELECT COUNT(*) FROM daily_challenge_completions WHERE student_id=? AND local_date=DATE '2030-01-01'",Integer.class,student));
        }
        assertEquals(before,jdbc.queryForObject("SELECT COUNT(*) FROM game_level_progress WHERE student_id=?",Integer.class,student));
        time("2030-01-02T12:00:00Z");assertFalse(daily.today(student).completed());
        assertEquals(5,sets.find(student,LocalDate.of(2030,1,1)).stream().filter(c->c.completedAt()!=null).count());
    }
}
