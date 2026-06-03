package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.RankingResponseDTO;
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
    public List<RankingResponseDTO> execute(String idGroup) {
        return rankingRepositoryPort.findAllByIdGroup(idGroup)
                .stream()
                .map(r -> new RankingResponseDTO(
                        r.getIdStudent(),
                        r.getTotalPoints(),
                        r.getPosition()
                ))
                .toList();
    }
}
