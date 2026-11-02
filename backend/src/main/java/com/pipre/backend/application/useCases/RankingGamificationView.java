package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.GameProgressDTO;
import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.input.GetGameProgressUseCase;
import com.pipre.backend.application.ports.output.GamificationRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;

/** Read verified global metadata without overwriting historical group balances or ranking points. */
@Component
@RequiredArgsConstructor
public class RankingGamificationView {
    private final GamificationRepositoryPort accounts;
    private final GetGameProgressUseCase progress;

    private record Metrics(GamificationRepositoryPort.Account account, GameProgressDTO progress) {}

    @Transactional(readOnly = true)
    public List<RankingDTO> apply(List<RankingDTO> rankings) {
        var byStudent = new HashMap<String, Metrics>();
        return rankings.stream().map(row -> {
            var metrics = byStudent.computeIfAbsent(row.idStudent(),
                    id -> new Metrics(accounts.account(id), progress.progress(id)));
            return new RankingDTO(row.idStudent(), row.studentName(), row.totalPoints(), row.position(),
                    metrics.account().level(), metrics.account().xpTotal(), metrics.progress().totalStars(),
                    metrics.progress().currentStreak(), metrics.progress().bestStreak());
        }).toList();
    }
}
