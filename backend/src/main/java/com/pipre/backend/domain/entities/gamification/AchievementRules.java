package com.pipre.backend.domain.entities.gamification;

import java.time.Duration;
import java.time.LocalDate;
import java.util.*;

/** Pure rules: technical, verified game progress, never inferred from legacy scores. */
public final class AchievementRules {
    private AchievementRules() {}
    public record LevelProgress(String game, int levelNumber, int bestStars,
            java.time.Instant firstCompletedAt, java.time.Instant lastCompletedAt) {}
    public record Streak(int current, int best) {}
    public record SpeedVictory(String sessionId,String game,int levelNumber,java.time.Instant startedAt,
            java.time.Instant completedAt,long startedOrder) {}
    public record SpeedStart(String sessionId,String game,int levelNumber,long startedOrder) {}

    public static Streak streak(Collection<LocalDate> completionDates, LocalDate today) {
        var dates = completionDates.stream().filter(d -> !d.isAfter(today)).distinct().sorted().toList();
        int run=0, best=0; LocalDate last=null;
        for (var day:dates) {
            run=last!=null && last.plusDays(1).equals(day) ? run+1 : 1;
            best=Math.max(best,run); last=day;
        }
        int current=last!=null && !last.isBefore(today.minusDays(1)) ? run : 0;
        return new Streak(current,best);
    }

    public static Set<String> earnedCodes(Collection<LevelProgress> progress, Streak streak, boolean speed) {
        var stars=new HashMap<String,Integer>();
        for (var p:progress) {
            if (Set.of("neonflow","tetrilogic").contains(p.game()) && p.levelNumber()>=1 && p.levelNumber()<=30 && p.bestStars()>=1)
                stars.merge(p.game()+":"+p.levelNumber(),p.bestStars(),Math::max);
        }
        var earned=new LinkedHashSet<String>();
        for(int n=1;n<=30;n++) if(stars.containsKey("neonflow:"+n)&&stars.containsKey("tetrilogic:"+n)) earned.add("L%02d".formatted(n));
        if(streak.best()>=5) earned.add("L31");
        if(java.util.stream.IntStream.rangeClosed(1,30).allMatch(n->stars.getOrDefault("tetrilogic:"+n,0)>=3)) earned.add("L32");
        if(speed) earned.add("L33");
        if(streak.best()>=10) earned.add("L34");
        if(java.util.stream.IntStream.rangeClosed(1,30).allMatch(n->stars.getOrDefault("neonflow:"+n,0)>=3)) earned.add("L35");
        return earned;
    }

    /** Retries of the next expected level are allowed; unrelated or out-of-order starts break the run. */
    public static boolean speed(List<SpeedVictory> victories, List<SpeedStart> sessionStarts) {
        if(victories.size()!=3 || sessionStarts.size()<3) return false;
        var a=victories.get(0); var b=victories.get(1); var c=victories.get(2);
        if(!a.game().equals(b.game()) || !a.game().equals(c.game())) return false;
        if(a.levelNumber()+1!=b.levelNumber() || b.levelNumber()+1!=c.levelNumber()) return false;
        if(a.startedOrder()>=b.startedOrder() || b.startedOrder()>=c.startedOrder()) return false;
        if(b.startedAt().isBefore(a.completedAt()) || c.startedAt().isBefore(b.completedAt())) return false;
        var winning=Map.of(a.startedOrder(),a,b.startedOrder(),b,c.startedOrder(),c);
        var seen=new HashSet<String>(); long previous=Long.MIN_VALUE;
        for(var start:sessionStarts) {
            if(start.startedOrder()<=previous || !a.game().equals(start.game())) return false;
            previous=start.startedOrder();
            var winner=winning.get(start.startedOrder());
            if(winner!=null) {
                if(!winner.sessionId().equals(start.sessionId()) || winner.levelNumber()!=start.levelNumber()) return false;
                seen.add(start.sessionId());
            } else {
                int expected=start.startedOrder()>a.startedOrder() && start.startedOrder()<b.startedOrder()?b.levelNumber()
                        :start.startedOrder()>b.startedOrder() && start.startedOrder()<c.startedOrder()?c.levelNumber():-1;
                if(start.levelNumber()!=expected) return false;
            }
        }
        if(seen.size()!=3) return false;
        var elapsed=Duration.between(a.startedAt(),c.completedAt());
        return !elapsed.isNegative() && elapsed.compareTo(Duration.ofSeconds(180))<0;
    }
}
