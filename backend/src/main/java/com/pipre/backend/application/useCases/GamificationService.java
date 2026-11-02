package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.VerifiedVictory;
import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.ports.input.*;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.gamification.Achievement;
import com.pipre.backend.domain.entities.gamification.AchievementRules;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GamificationService implements RecordVerifiedVictoryUseCase,DailyChallengeUseCase,GetGameProgressUseCase,ExportAchievementsUseCase {
    public static final ZoneId DAILY_ZONE=ZoneId.of("America/Lima");
    private final GamificationRepositoryPort repository;
    private final AchievementRepositoryPort achievements;
    private final UserRepositoryPort users;
    private final Clock clock;

    private String resolve(String id) {
        var user=id!=null&&id.contains("@")?users.findByEmail(id):users.findById(id);
        return user.orElseThrow(()->new BusinessException("El estudiante no existe.")).getIdUser();
    }
    private LocalDate todayDate() { return LocalDate.now(clock.withZone(DAILY_ZONE)); }

    @Override @Transactional
    public VictoryAwardsDTO execute(VerifiedVictory v) {
        if(v==null || v.game()==null || !Set.of("neonflow","tetrilogic").contains(v.game()) || v.levelNumber()<1 || v.levelNumber()>30
                || v.studentId()==null || v.studentId().isBlank() || v.sessionId()==null || v.sessionId().isBlank()
                || v.stars()<1 || v.stars()>3 || v.startedAt()==null || v.completedAt()==null
                || v.completedAt().isBefore(v.startedAt()) || v.startedOrder()<1
                || !(v.game()+"-v2-"+v.levelNumber()).equals(v.levelTemplate()))
            throw new BusinessException("La victoria verificada no es válida.");
        repository.lockStudent(v.studentId());
        if(!repository.recordVictory(v)) return new VictoryAwardsDTO(bestStars(v),List.of(),today(v.studentId()));
        repository.improveProgress(v);
        LocalDate completedDay=v.completedAt().atZone(DAILY_ZONE).toLocalDate();
        if(v.dailyChallengeId()!=null && v.dailyChallengeId().equals(completedDay.toString())
                && v.startedAt().atZone(DAILY_ZONE).toLocalDate().equals(completedDay)) {
            var daily=repository.daily(completedDay);
            if(daily.game().equals(v.game()) && daily.levelTemplate().equals(v.levelTemplate()))
                repository.completeDaily(v.studentId(),completedDay,v.sessionId(),v.completedAt());
        }
        var streak=AchievementRules.streak(repository.dailyDates(v.studentId()),todayDate());
        var last=repository.recentVictories(v.studentId());
        var timed=last.stream().map(w->new AchievementRules.SpeedVictory(w.sessionId(),w.game(),w.levelNumber(),w.startedAt(),w.completedAt(),w.startedOrder())).toList();
        boolean speed=last.size()==3 && AchievementRules.speed(timed,
                repository.sessionStarts(v.studentId(),last.get(0).startedOrder(),v.completedAt()));
        var codes=AchievementRules.earnedCodes(repository.progress(v.studentId()),streak,speed);
        var newlyUnlocked=new ArrayList<AchievementDTO>();
        for(var a:activeCatalog()) if(codes.contains(a.getCode()) && repository.unlock(v.studentId(),a,v.sessionId(),v.completedAt()))
            newlyUnlocked.add(view(a,true,v.completedAt().toString()));
        repository.syncMembershipStats(v.studentId(),streak.current(),streak.best());
        return new VictoryAwardsDTO(bestStars(v),List.copyOf(newlyUnlocked),today(v.studentId()));
    }
    private int bestStars(VerifiedVictory v) {
        return repository.progress(v.studentId()).stream().filter(p->p.game().equals(v.game())&&p.levelNumber()==v.levelNumber())
                .mapToInt(AchievementRules.LevelProgress::bestStars).max().orElse(v.stars());
    }

    @Override @Transactional
    public DailyChallengeDTO today(String studentId) {
        String id=resolve(studentId); LocalDate date=todayDate(); var daily=repository.daily(date);
        var dates=repository.dailyDates(id); var streak=AchievementRules.streak(dates,date);
        return new DailyChallengeDTO(date.toString(),date.toString(),DAILY_ZONE.getId(),daily.game(),daily.levelNumber(),daily.levelTemplate(),dates.contains(date),streak.current(),streak.best());
    }
    @Override @Transactional
    public void validate(String studentId,String dailyId,String game,String templateId) {
        var daily=today(studentId);
        if(!daily.id().equals(dailyId) || !daily.game().equals(game) || !daily.levelTemplate().equals(templateId))
            throw new BusinessException("El reto diario no corresponde al día o tablero actual de America/Lima.");
    }

    @Override @Transactional(readOnly=true)
    public GameProgressDTO progress(String studentId) {
        String id=resolve(studentId);
        var progress=repository.progress(id);
        var byLevel=progress.stream().collect(Collectors.toMap(p->p.game()+":"+p.levelNumber(),Function.identity()));
        var levels=new ArrayList<GameProgressDTO.Level>();
        for(String game:List.of("neonflow","tetrilogic")) for(int number=1;number<=30;number++) {
            var p=byLevel.get(game+":"+number);
            levels.add(new GameProgressDTO.Level(game,number,p!=null,p==null?0:p.bestStars(),p==null?null:p.firstCompletedAt().toString(),p==null?null:p.lastCompletedAt().toString()));
        }
        var streak=AchievementRules.streak(repository.dailyDates(id),todayDate());
        return new GameProgressDTO(List.copyOf(levels),progress.size(),60,progress.stream().mapToInt(AchievementRules.LevelProgress::bestStars).sum(),streak.current(),streak.best());
    }

    @Override @Transactional(readOnly=true)
    public AchievementExportDTO export(String studentId,LocalDate from,LocalDate to) {
        String id=resolve(studentId);
        if(from==null||to==null||to.isBefore(from)) throw new BusinessException("El periodo de exportación no es válido.");
        Instant lower=from.atStartOfDay(DAILY_ZONE).toInstant(), upper;
        try { upper=to.plusDays(1).atStartOfDay(DAILY_ZONE).toInstant(); }
        catch(DateTimeException ex) { throw new BusinessException("El periodo de exportación no es válido."); }
        var unlocks=repository.unlocks(id).stream().collect(Collectors.toMap(GamificationRepositoryPort.Unlock::achievementId,Function.identity()));
        var rows=new ArrayList<AchievementExportDTO.Entry>();
        for(var a:activeCatalog()) {
            var u=unlocks.get(a.getIdAchievement());
            boolean inPeriod=u!=null && u.verifiedAt()!=null && !u.verifiedAt().isBefore(lower) && u.verifiedAt().isBefore(upper);
            rows.add(new AchievementExportDTO.Entry(a.getCode(),u!=null,u==null?0:1,u==null?null:u.unlockedAt(),inPeriod,inPeriod?1:0));
        }
        return new AchievementExportDTO(new AchievementExportDTO.Period(from.toString(),to.toString(),DAILY_ZONE.getId()),List.copyOf(rows),
                (int)rows.stream().filter(AchievementExportDTO.Entry::unlocked).count(),(int)rows.stream().filter(AchievementExportDTO.Entry::unlockedInPeriod).count());
    }
    private List<Achievement> activeCatalog() { return achievements.findAll().stream().filter(Achievement::isActive).sorted(Comparator.comparing(Achievement::getCode)).toList(); }
    public static AchievementDTO view(Achievement a,boolean unlocked,String at) {
        return new AchievementDTO(a.getIdAchievement(),a.getCode(),a.getName(),a.getDescription(),a.getIcon(),a.getCategory(),a.getXpReward(),a.isHidden(),unlocked,at,a.getUnlockCondition(),a.isActive());
    }
}
