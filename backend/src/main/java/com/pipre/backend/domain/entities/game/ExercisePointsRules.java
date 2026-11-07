package com.pipre.backend.domain.entities.game;

import java.math.BigInteger;

/** Agreed points contract; it is not an academic grade or evidence of learning. */
public final class ExercisePointsRules {
    public static final String VERSION="verified-points-v1";
    public static final int DAILY_XP=50;
    public static final long REFERENCE_TIME_MS=180_000;
    private ExercisePointsRules() {}
    public static int points(int moves,int referenceMoves,long durationMs) {
        if(moves<0||referenceMoves<1||durationMs<0)throw new IllegalArgumentException("Invalid verified score metrics");
        int efficiency=(int)(30L*referenceMoves/Math.max(referenceMoves,moves));
        int time=BigInteger.valueOf(20L*REFERENCE_TIME_MS)
            .divide(BigInteger.valueOf(durationMs).add(BigInteger.valueOf(REFERENCE_TIME_MS))).intValueExact();
        return 50+efficiency+time;
    }
}
