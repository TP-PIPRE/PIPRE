package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.VerifiedVictory;
import com.pipre.backend.application.dto.StudentHistoryDTO;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.gamification.*;
import com.pipre.backend.domain.entities.gamification.AchievementRules.LevelProgress;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GamificationServiceTest {
    private final Instant base=Instant.parse("2026-11-02T15:00:00Z");
    private final AtomicReference<Instant> now=new AtomicReference<>(base);
    private MemoryRepository repository; private AchievementRepositoryPort catalog; private UserRepositoryPort users; private GamificationService service;
    @BeforeEach void setup() {
        repository=new MemoryRepository();catalog=mock(AchievementRepositoryPort.class);users=mock(UserRepositoryPort.class);
        var user=mock(User.class);when(user.getIdUser()).thenReturn("student");when(users.findById("student")).thenReturn(Optional.of(user));
        var clock=mock(Clock.class);when(clock.withZone(any())).thenAnswer(i->Clock.fixed(now.get(),i.getArgument(0)));
        var achievements=new ArrayList<Achievement>();for(int n=1;n<=35;n++)achievements.add(Achievement.builder().idAchievement("ach-L%02d".formatted(n)).code("L%02d".formatted(n)).name("Logro "+n).active(true).unlockCondition("Condición "+n).xpReward(100).build());
        achievements.add(Achievement.builder().idAchievement("old").code("PRIMER_RETO").name("Histórico").active(false).xpReward(999).build());
        when(catalog.findAll()).thenReturn(achievements);service=new GamificationService(repository,catalog,users,clock);
    }
    private VerifiedVictory victory(String id,String game,int n,int stars) {return new VerifiedVictory("student",id,game,n,game+"-v2-"+n,null,now.get().minusSeconds(20),now.get(),stars,null,repository.victories.size()+1);}
    @Test void loneNeonDoesNotUnlockPairedAchievement() {assertTrue(service.execute(victory("n","neonflow",1,2)).newAchievements().isEmpty());}
    @ParameterizedTest @ValueSource(booleans={true,false}) void bothOrdersUnlockOnlyMatchingLevel(boolean neonFirst) {
        String first=neonFirst?"neonflow":"tetrilogic",second=neonFirst?"tetrilogic":"neonflow";
        service.execute(victory("first",first,1,2));var result=service.execute(victory("second",second,1,1));
        assertEquals(List.of("L01"),result.newAchievements().stream().map(a->a.code()).toList());assertEquals(100,repository.xp);
    }
    @Test void retryAndRepeatedVictoriesDoNotDuplicateAchievementOrXp() {
        service.execute(victory("n","neonflow",1,3));var v=victory("t","tetrilogic",1,3);service.execute(v);
        assertTrue(service.execute(v).newAchievements().isEmpty());
        assertTrue(service.execute(victory("t2","tetrilogic",1,1)).newAchievements().isEmpty());
        assertEquals(100,repository.xp);assertEquals(3,service.progress("student").levels().stream().filter(l->l.game().equals("tetrilogic")&&l.levelNumber()==1).findFirst().orElseThrow().bestStars());
    }
    @Test void lowerStarsNeverReplaceBestAndImprovementPersists() {
        service.execute(victory("n1","neonflow",8,1));assertEquals(1,service.progress("student").totalStars());
        service.execute(victory("n2","neonflow",8,3));service.execute(victory("n3","neonflow",8,2));
        assertEquals(3,service.progress("student").totalStars());assertEquals(1,service.progress("student").completedLevels());
    }
    @Test void laterServiceInstanceReadsSamePersistedProgressAndUnlocks() {
        service.execute(victory("n","neonflow",1,3));service.execute(victory("t","tetrilogic",1,2));
        var reloaded=new GamificationService(repository,catalog,users,Clock.fixed(base,ZoneOffset.UTC));
        assertEquals(2,reloaded.progress("student").completedLevels());assertEquals(1,reloaded.export("student",LocalDate.of(2026,11,1),LocalDate.of(2026,11,3)).unlockedTotal());
    }
    @Test void activeCatalogExportHasExactly35StableBinaryColumns() {
        var data=service.export("student",LocalDate.of(2026,11,1),LocalDate.of(2026,11,2));assertEquals(35,data.achievements().size());
        assertEquals("L01",data.achievements().get(0).code());assertEquals("L35",data.achievements().get(34).code());assertEquals(0,data.unlockedTotal());
    }
    @Test void exportedPeriodSeparatesOlderUnlockFromNewUnlock() {
        repository.unlocks.put("ach-L01",new GamificationRepositoryPort.Unlock("ach-L01","2026-11-02T04:59:59Z",Instant.parse("2026-11-02T04:59:59Z")));
        repository.unlocks.put("ach-L02",new GamificationRepositoryPort.Unlock("ach-L02","2026-11-02T05:00:00Z",Instant.parse("2026-11-02T05:00:00Z")));
        repository.unlocks.put("ach-L03",new GamificationRepositoryPort.Unlock("ach-L03","2026-11-03T05:00:00Z",Instant.parse("2026-11-03T05:00:00Z")));
        var result=service.export("student",LocalDate.of(2026,11,2),LocalDate.of(2026,11,2));
        assertEquals(3,result.unlockedTotal());assertEquals(1,result.newInPeriod());assertTrue(result.achievements().get(1).unlockedInPeriod());
    }
    @Test void historicalNaiveTimestampIsNeverAssignedAnInventedZone() {
        repository.unlocks.put("ach-L01",new GamificationRepositoryPort.Unlock("ach-L01","2026-11-02T12:00:00",null));
        assertEquals(0,service.export("student",LocalDate.of(2026,11,1),LocalDate.of(2026,11,3)).newInPeriod());
    }
    @Test void limaDateIsPreviousCalendarDayBeforeFiveUtc() {
        now.set(Instant.parse("2026-11-02T04:59:59Z"));assertEquals("2026-11-01",service.today("student").id());
        now.set(Instant.parse("2026-11-02T05:00:00Z"));assertEquals("2026-11-02",service.today("student").id());
    }
    @Test void dailyIdentityAndGameAreValidatedBeforeStarting() {
        var daily=service.today("student");assertDoesNotThrow(()->service.validate("student",daily.id(),daily.game(),daily.levelTemplate()));
        assertThrows(BusinessException.class,()->service.validate("student","2020-01-01",daily.game(),daily.levelTemplate()));
        assertThrows(BusinessException.class,()->service.validate("student",daily.id(),daily.game(),"tetrilogic-v2-99"));
    }
    @Test void oneValidDailyCreditPerStudentDay() {
        var daily=service.today("student");for(int n=0;n<2;n++) {
            var v=victory("daily"+n,daily.game(),daily.levelNumber(),2);
            service.execute(new VerifiedVictory(v.studentId(),v.sessionId(),v.game(),v.levelNumber(),v.levelTemplate(),null,v.startedAt(),v.completedAt(),v.stars(),daily.id(),v.startedOrder()));
        }
        assertEquals(1,repository.days.size());assertEquals(1,service.today("student").currentStreak());assertTrue(service.today("student").completed());
    }
    @Test void completingOldDailyAfterMidnightKeepsNormalProgressWithoutDailyCredit() {
        now.set(Instant.parse("2026-11-02T04:59:59Z"));var daily=service.today("student");Instant started=now.get();
        now.set(Instant.parse("2026-11-02T05:00:01Z"));
        service.execute(new VerifiedVictory("student","midnight",daily.game(),daily.levelNumber(),daily.levelTemplate(),null,started,now.get(),2,daily.id(),1));
        assertEquals(1,service.progress("student").completedLevels());assertTrue(repository.days.isEmpty());
    }
    @Test void serverCompletionBeforeMidnightKeepsItsCreditWhenCallbackRunsJustAfterMidnight() {
        now.set(Instant.parse("2026-11-02T04:59:50Z"));var daily=service.today("student");
        Instant started=Instant.parse("2026-11-02T04:59:40Z"),completed=Instant.parse("2026-11-02T04:59:59.999Z");
        now.set(Instant.parse("2026-11-02T05:00:00.010Z"));
        service.execute(new VerifiedVictory("student","before-midnight",daily.game(),daily.levelNumber(),daily.levelTemplate(),null,started,completed,2,daily.id(),1));
        assertEquals(Set.of(LocalDate.of(2026,11,1)),repository.days);
        var today=service.today("student");assertEquals("2026-11-02",today.date());assertFalse(today.completed());assertEquals(1,today.currentStreak());
    }
    @Test void tenDailyCompletionsAwardBothThresholdsAndNoInactiveDayIsInvented() {
        for(int day=0;day<10;day++) {
            now.set(base.plus(Duration.ofDays(day)));var daily=service.today("student");
            service.execute(new VerifiedVictory("student","daily"+day,daily.game(),daily.levelNumber(),daily.levelTemplate(),null,now.get().minusSeconds(10),now.get(),1,daily.id(),day+1));
        }
        assertTrue(repository.unlocks.containsKey("ach-L31"));assertTrue(repository.unlocks.containsKey("ach-L34"));
        assertEquals(10,service.today("student").bestStreak());now.set(base.plus(Duration.ofDays(12)));assertEquals(0,service.today("student").currentStreak());assertEquals(10,repository.days.size());
    }
    @Test void invalidStarsDoNotWriteAnything() {
        assertThrows(BusinessException.class,()->service.execute(victory("bad","neonflow",1,4)));assertTrue(repository.victories.isEmpty());
    }
    @Test void foreignOrUnknownStudentCannotReadProgress() {assertThrows(BusinessException.class,()->service.progress("other"));}
    @Test void reversedExportWindowIsRejected() {assertThrows(BusinessException.class,()->service.export("student",LocalDate.of(2026,11,3),LocalDate.of(2026,11,1)));}

    static class MemoryRepository implements GamificationRepositoryPort {
        final Map<String,VerifiedVictory> victories=new LinkedHashMap<>();final Map<String,LevelProgress> levels=new HashMap<>();
        final Map<String,Unlock> unlocks=new HashMap<>();final Set<LocalDate> days=new HashSet<>();int xp;
        public void lockStudent(String id) {if(!"student".equals(id))throw new BusinessException("Estudiante no existe");}
        public boolean recordVictory(VerifiedVictory v) {return victories.putIfAbsent(v.sessionId(),v)==null;}
        public void improveProgress(VerifiedVictory v) {var old=levels.get(v.game()+v.levelNumber());levels.put(v.game()+v.levelNumber(),new LevelProgress(v.game(),v.levelNumber(),Math.max(v.stars(),old==null?0:old.bestStars()),old==null?v.completedAt():old.firstCompletedAt(),v.completedAt()));}
        public List<LevelProgress> progress(String id) {return new ArrayList<>(levels.values());}
        public List<VerifiedVictory> recentVictories(String id) {var all=new ArrayList<>(victories.values());return all.subList(Math.max(0,all.size()-3),all.size());}
        public List<AchievementRules.SpeedStart> sessionStarts(String id,long order,Instant at) {return victories.values().stream().filter(v->v.startedOrder()>=order&&!v.startedAt().isAfter(at)).map(v->new AchievementRules.SpeedStart(v.sessionId(),v.game(),v.levelNumber(),v.startedOrder())).toList();}
        public Daily daily(LocalDate date) {int index=Math.floorMod(date.toEpochDay(),60);String game=index<30?"neonflow":"tetrilogic";int n=index%30+1;return new Daily(date,game,n,game+"-v2-"+n);}
        public void completeDaily(String id,LocalDate date,String sessionId,Instant at) {days.add(date);}
        public List<LocalDate> dailyDates(String id) {return new ArrayList<>(days);}
        public List<Unlock> unlocks(String id) {return new ArrayList<>(unlocks.values());}
        public boolean unlock(String id,Achievement a,String sessionId,Instant at) {if(unlocks.putIfAbsent(a.getIdAchievement(),new Unlock(a.getIdAchievement(),at.toString(),at))!=null)return false;xp+=a.getXpReward();return true;}
        public void syncMembershipStats(String id,int current,int best) {}
        public Account account(String id) {return new Account(xp,1,BigDecimal.ZERO,0);}
        public List<StudentHistoryDTO> history(String id) {return List.of();}
    }
}
