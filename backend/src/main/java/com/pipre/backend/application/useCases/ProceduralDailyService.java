package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class ProceduralDailyService {
    private final DailySetRepositoryPort sets;
    private final GamificationRepositoryPort gamification;
    private final DailyChallengeSelectionPolicy selection;
    private final ProceduralDailyGenerator generator;
    private final Clock clock;
    public record DailySet(String date,String timeZone,String expiresAt,List<DailySetRepositoryPort.Challenge> challenges) {
        @com.fasterxml.jackson.annotation.JsonProperty("completedCount") public long completedCount() { return challenges.stream().filter(c->c.completedAt()!=null).count(); }
        @com.fasterxml.jackson.annotation.JsonProperty("progressPercent") public long progressPercent() { return completedCount()*20; }
        @com.fasterxml.jackson.annotation.JsonProperty("completed") public boolean completed() { return challenges.size()==5&&completedCount()==5; }
        @com.fasterxml.jackson.annotation.JsonProperty("status") public String status() { return completed()?"COMPLETED":completedCount()>0?"IN_PROGRESS":"PENDING"; }
    }
    private LocalDate date() { return LocalDate.now(clock.withZone(GamificationService.DAILY_ZONE)); }
    @Transactional public DailySet today(String studentId) {
        gamification.lockStudent(studentId);
        LocalDate day=date();var challenges=sets.find(studentId,day);
        if(challenges.isEmpty()) {
            var specs=selection.select(studentId,day);
            if(specs.size()!=5) throw new IllegalStateException("Daily selection must contain five challenges");
            List<DailySetRepositoryPort.Challenge> created=new ArrayList<>();Set<String> unique=new HashSet<>();
            for(var spec:specs) {
                var generated=generator.generate(spec);
                var geometry=generated.config().deepCopy();
                if(geometry.isObject()) {var o=(com.fasterxml.jackson.databind.node.ObjectNode)geometry;for(String key:List.of("level","templateId","title","description","cognitiveDimension"))o.remove(key);}
                if(!unique.add(spec.game()+geometry.toString()))throw new IllegalStateException("Repeated daily geometry");
                created.add(new DailySetRepositoryPort.Challenge(UUID.randomUUID().toString(),studentId,day,created.size()+1,spec.game(),spec.level(),
                    spec.game()+"-v2-"+spec.level(),generated.difficulty(),generated.config(),null,0,null));
            }
            sets.save(studentId,day,created);challenges=List.copyOf(created);
        }
        if(challenges.size()!=5)throw new IllegalStateException("Incomplete daily set");
        return new DailySet(day.toString(),GamificationService.DAILY_ZONE.getId(),day.plusDays(1).atStartOfDay(GamificationService.DAILY_ZONE).toInstant().toString(),challenges);
    }
    public static boolean procedural(String id) { return id!=null&&id.length()==36; }
    public int bestStars(String id) { return sets.findById(id).orElseThrow().bestStars(); }
    public JsonNode config(String studentId,String id,String game,String template,boolean requireToday) {
        var c=sets.findById(id).orElseThrow(()->new BusinessException("El reto diario no existe."));
        if(!c.studentId().equals(studentId)||!c.game().equals(game)||!c.levelTemplate().equals(template)||(requireToday&&!c.date().equals(date())))
            throw new BusinessException("El reto diario no corresponde al estudiante, fecha o tablero.");
        if(requireToday&&sets.find(studentId,c.date()).stream().anyMatch(previous->previous.slot()<c.slot()&&previous.completedAt()==null))
            throw new BusinessException("Completa el ejercicio anterior para continuar.");
        return c.config();
    }
    public void start(String id,Instant at) { sets.start(id,at); }
    public Optional<Boolean> completed(String studentId,LocalDate day) {
        var challenges=sets.find(studentId,day);
        return challenges.isEmpty()?Optional.empty():Optional.of(challenges.size()==5&&challenges.stream().allMatch(c->c.completedAt()!=null));
    }
    public void complete(String studentId,String id,String sessionId,Instant started,Instant at,int stars) {
        var c=sets.findById(id).orElseThrow(()->new BusinessException("El reto diario no existe."));
        if(!c.studentId().equals(studentId))throw new BusinessException("El reto pertenece a otro estudiante.");
        if(!c.date().equals(at.atZone(GamificationService.DAILY_ZONE).toLocalDate())||!c.date().equals(started.atZone(GamificationService.DAILY_ZONE).toLocalDate()))return;
        sets.complete(id,sessionId,at,stars);
        if(completed(studentId,c.date()).orElse(false)) {
            gamification.daily(c.date()); // Preserve the historical date/streak FK and one completion per date.
            gamification.completeDaily(studentId,c.date(),sessionId,at);
        }
    }
}
