package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.input.GetGroupRankingUseCase;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetGroupRankingService implements GetGroupRankingUseCase {
    private final RankingRepositoryPort rankingRepositoryPort;

    @Override
    public List<RankingDTO> execute(String idGroup) {
        return rankingRepositoryPort.findAllByIdGroup(idGroup)
                .stream()
                .map(r -> new RankingDTO(
                        r.getIdStudent(),
                        r.getStudentName(),
                        r.getTotalPoints(),
                        r.getPosition(),
                        r.getLevel(),
                        r.getXpTotal(),
                        r.getTotalStars(),
                        r.getCurrentStreak(),
                        r.getMaxStreak()
                ))
                .toList();
    }
}
