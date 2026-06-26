package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.input.RemoveStudentRankingUseCase;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RemoveStudentRankingService implements RemoveStudentRankingUseCase {
    private final RankingRepositoryPort rankingRepositoryPort;

    @Override
    public void execute(String idGroup, String idStudent) {
        rankingRepositoryPort.deleteByGroupAndStudent(idGroup, idStudent);
    }
}
