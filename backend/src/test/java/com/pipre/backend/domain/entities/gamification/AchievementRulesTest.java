package com.pipre.backend.domain.entities.gamification;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class AchievementRulesTest {
    private static final Instant START=Instant.parse("2026-11-01T12:00:00Z");
    private AchievementRules.LevelProgress level(String game,int n,int stars) { return new AchievementRules.LevelProgress(game,n,stars,START,START); }
    private Set<String> earned(List<AchievementRules.LevelProgress> p) { return AchievementRules.earnedCodes(p,new AchievementRules.Streak(0,0),false); }

    @Test void onlyOneGameDoesNotUnlockPairedLevel() { assertFalse(earned(List.of(level("neonflow",1,3))).contains("L01")); }
    @Test void bothGamesUnlockSameLevel() { assertTrue(earned(List.of(level("neonflow",1,1),level("tetrilogic",1,1))).contains("L01")); }
    @Test void differentLevelNumbersDoNotPair() { assertTrue(earned(List.of(level("neonflow",1,3),level("tetrilogic",2,3))).isEmpty()); }
    @ParameterizedTest @ValueSource(ints={1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30})
    void everyPairedCodeMatchesItsExactLevel(int n) { assertEquals(Set.of("L%02d".formatted(n)),earned(List.of(level("neonflow",n,2),level("tetrilogic",n,1)))); }
    @Test void duplicateProgressDoesNotInflateMastery() {
        var rows=new ArrayList<AchievementRules.LevelProgress>();for(int n=1;n<=29;n++)rows.add(level("tetrilogic",n,3));
        rows.add(level("tetrilogic",1,3));assertFalse(earned(rows).contains("L32"));
    }
    @Test void thirtyTetriThreeStarsUnlockMastery() {
        var rows=new ArrayList<AchievementRules.LevelProgress>();for(int n=1;n<=30;n++)rows.add(level("tetrilogic",n,3));
        assertTrue(earned(rows).contains("L32"));assertFalse(earned(rows).contains("L35"));
    }
    @Test void thirtyNeonThreeStarsUnlockMastery() {
        var rows=new ArrayList<AchievementRules.LevelProgress>();for(int n=1;n<=30;n++)rows.add(level("neonflow",n,3));
        assertTrue(earned(rows).contains("L35"));assertFalse(earned(rows).contains("L32"));
    }
    @Test void oneLowerStarPreventsMastery() {
        var rows=new ArrayList<AchievementRules.LevelProgress>();for(int n=1;n<=30;n++)rows.add(level("neonflow",n,n==30?2:3));
        assertFalse(earned(rows).contains("L35"));
    }
    @Test void fiveConsecutiveDatesUnlockL31() {
        var today=LocalDate.of(2026,11,5);var dates=new ArrayList<LocalDate>();for(int n=0;n<5;n++)dates.add(today.minusDays(n));
        var streak=AchievementRules.streak(dates,today);assertEquals(5,streak.current());assertEquals(5,streak.best());
        assertEquals(Set.of("L31"),AchievementRules.earnedCodes(List.of(),streak,false));
    }
    @Test void gapBreaksCalendarStreak() {
        var today=LocalDate.of(2026,11,7);
        assertEquals(new AchievementRules.Streak(1,4),AchievementRules.streak(List.of(today,today.minusDays(2),today.minusDays(3),today.minusDays(4),today.minusDays(5)),today));
    }
    @Test void duplicateDayDoesNotIncreaseStreak() {
        var today=LocalDate.of(2026,11,7);assertEquals(new AchievementRules.Streak(1,1),AchievementRules.streak(List.of(today,today,today),today));
    }
    @Test void tenDaysUnlockBothConstancyAchievements() {
        assertEquals(Set.of("L31","L34"),AchievementRules.earnedCodes(List.of(),new AchievementRules.Streak(10,10),false));
    }
    @Test void yesterdayKeepsCurrentStreakButTwoDayGapExpiresIt() {
        var today=LocalDate.of(2026,11,7);assertEquals(1,AchievementRules.streak(List.of(today.minusDays(1)),today).current());
        assertEquals(new AchievementRules.Streak(0,1),AchievementRules.streak(List.of(today.minusDays(2)),today));
    }
    private List<AchievementRules.SpeedVictory> speed(int total) {
        return List.of(new AchievementRules.SpeedVictory("a","neonflow",4,START,START.plusSeconds(40),1),
                new AchievementRules.SpeedVictory("b","neonflow",5,START.plusSeconds(41),START.plusSeconds(80),2),
                new AchievementRules.SpeedVictory("c","neonflow",6,START.plusSeconds(81),START.plusSeconds(total),3));
    }
    private List<AchievementRules.SpeedStart> starts(List<AchievementRules.SpeedVictory> rows) { return rows.stream().map(v->new AchievementRules.SpeedStart(v.sessionId(),v.game(),v.levelNumber(),v.startedOrder())).toList(); }
    @Test void speed179SecondsAccepted() { assertTrue(AchievementRules.speed(speed(179),starts(speed(179)))); }
    @Test void speed180SecondsRejected() { assertFalse(AchievementRules.speed(speed(180),starts(speed(180)))); }
    @Test void strictBoundaryIncludesNanoseconds() {
        var rows=new ArrayList<>(speed(180));var c=rows.get(2);rows.set(2,new AchievementRules.SpeedVictory(c.sessionId(),c.game(),c.levelNumber(),c.startedAt(),c.completedAt().minusNanos(1),c.startedOrder()));
        assertTrue(AchievementRules.speed(rows,starts(rows)));
    }
    @Test void unrelatedGameStartInvalidatesSpeedEvenWithoutVictory() {
        var rows=speed(179);var starts=new ArrayList<>(starts(rows));starts.add(1,new AchievementRules.SpeedStart("other","tetrilogic",5,1));
        assertFalse(AchievementRules.speed(rows,starts));
    }
    @Test void retryOfTheNextExpectedLevelIsAllowed() {
        var rows=List.of(new AchievementRules.SpeedVictory("a","neonflow",4,START,START.plusSeconds(40),1),
                new AchievementRules.SpeedVictory("b","neonflow",5,START.plusSeconds(60),START.plusSeconds(80),3),
                new AchievementRules.SpeedVictory("c","neonflow",6,START.plusSeconds(100),START.plusSeconds(179),5));
        var starts=List.of(new AchievementRules.SpeedStart("a","neonflow",4,1),new AchievementRules.SpeedStart("retry-b","neonflow",5,2),
                new AchievementRules.SpeedStart("b","neonflow",5,3),new AchievementRules.SpeedStart("retry-c","neonflow",6,4),new AchievementRules.SpeedStart("c","neonflow",6,5));
        assertTrue(AchievementRules.speed(rows,starts));
        var unrelated=new ArrayList<>(starts);unrelated.set(1,new AchievementRules.SpeedStart("retry-b","neonflow",4,2));
        assertFalse(AchievementRules.speed(rows,unrelated));
        unrelated.set(1,new AchievementRules.SpeedStart("retry-b","tetrilogic",5,2));assertFalse(AchievementRules.speed(rows,unrelated));
    }
    @Test void differentGameInvalidatesSpeed() {
        var rows=new ArrayList<>(speed(179));var b=rows.get(1);rows.set(1,new AchievementRules.SpeedVictory("b","tetrilogic",5,b.startedAt(),b.completedAt(),2));
        assertFalse(AchievementRules.speed(rows,starts(rows)));
    }
    @Test void repeatedOrSkippedLevelInvalidatesSpeed() {
        for(int n:List.of(4,6,7)) {
            var rows=new ArrayList<>(speed(179));var b=rows.get(1);rows.set(1,new AchievementRules.SpeedVictory("b",b.game(),n,b.startedAt(),b.completedAt(),2));
            assertFalse(AchievementRules.speed(rows,starts(rows)));
        }
    }
    @Test void overlappingSessionsCannotPrestartTheSpeedSequence() {
        var rows=new ArrayList<>(speed(179));var b=rows.get(1);rows.set(1,new AchievementRules.SpeedVictory("b",b.game(),5,START.plusSeconds(10),b.completedAt(),2));
        assertFalse(AchievementRules.speed(rows,starts(rows)));
    }
}
