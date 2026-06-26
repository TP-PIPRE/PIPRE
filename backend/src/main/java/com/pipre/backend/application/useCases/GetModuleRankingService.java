package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.input.GetModuleRankingUseCase;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GetModuleRankingService implements GetModuleRankingUseCase {
    private final ResultRepositoryPort resultRepositoryPort;

    @Override
    public List<RankingDTO> execute(String moduleId) {
        return resultRepositoryPort.findModuleRankingRaw(moduleId).stream()
                .map(this::rowToRankingDTO)
                .toList();
    }

    private RankingDTO rowToRankingDTO(Object[] row) {
        return new RankingDTO(
                (String) row[0],
                (String) row[1],
                (BigDecimal) row[2],
                ((Number) row[3]).intValue(),
                ((Number) row[4]).intValue(),
                ((Number) row[5]).intValue(),
                ((Number) row[6]).intValue(),
                ((Number) row[7]).intValue(),
                ((Number) row[8]).intValue()
        );
    }
}
