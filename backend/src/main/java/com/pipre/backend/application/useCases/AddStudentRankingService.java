package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.RankingRequestDTO;
import com.pipre.backend.application.ports.input.AddStudentRankingUseCase;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.Ranking;
import com.pipre.backend.domain.entities.Result;
import com.pipre.backend.domain.factories.RankingFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AddStudentRankingService implements AddStudentRankingUseCase {
    private final RankingRepositoryPort rankingRepositoryPort;
    private final ResultRepositoryPort resultRepositoryPort;

    @Override
    @Transactional
    public void execute(RankingRequestDTO requestDTO) {
        BigDecimal totalPoints = resultRepositoryPort.findByIdStudent(requestDTO.idStudent())
                .stream()
                .map(Result::getScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Ranking ranking = RankingFactory.createNewRanking(
                requestDTO.idGroup(),
                requestDTO.idStudent(),
                totalPoints
        );

        rankingRepositoryPort.save(ranking);
        rankingRepositoryPort.sortRanking(requestDTO.idGroup());
    }
}
