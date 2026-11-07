package com.pipre.backend.application.ports.output;
import java.util.*;
public interface RankingMetadataPort {
    record Metadata(int level,int xp,int stars,int currentStreak,int bestStreak) {}
    Map<String,Metadata> load(Set<String> studentIds);
}
