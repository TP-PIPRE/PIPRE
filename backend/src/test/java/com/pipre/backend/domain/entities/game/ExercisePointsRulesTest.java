package com.pipre.backend.domain.entities.game;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ExercisePointsRulesTest {
    @Test void maximumRequiresEfficientVerifiedActionsAndNoElapsedTime() {assertEquals(100,ExercisePointsRules.points(4,4,0));}
    @Test void referenceTimeAwardsHalfOfTheTimeBonus() {assertEquals(90,ExercisePointsRules.points(4,4,180_000));}
    @Test void fewerActionsImproveTheSameTimedAttempt() {assertTrue(ExercisePointsRules.points(4,4,180_000)>ExercisePointsRules.points(8,4,180_000));}
    @Test void lessServerTimeImprovesTheSameActionCount() {assertTrue(ExercisePointsRules.points(4,4,60_000)>ExercisePointsRules.points(4,4,180_000));}
    @Test void extremeDurationAndActionsDoNotOverflowOrFallBelowCompletionPoints() {assertEquals(50,ExercisePointsRules.points(Integer.MAX_VALUE,1,Long.MAX_VALUE));}
    @Test void zeroActionsCannotExceedTheMaximum() {assertEquals(100,ExercisePointsRules.points(0,4,0));}
    @Test void rejectsInvalidMetrics() {
        assertThrows(IllegalArgumentException.class,()->ExercisePointsRules.points(-1,1,0));
        assertThrows(IllegalArgumentException.class,()->ExercisePointsRules.points(1,0,0));
        assertThrows(IllegalArgumentException.class,()->ExercisePointsRules.points(1,1,-1));
    }
}
