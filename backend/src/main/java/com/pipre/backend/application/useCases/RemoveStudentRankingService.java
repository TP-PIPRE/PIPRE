package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.input.RemoveStudentRankingUseCase;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RemoveStudentRankingService implements RemoveStudentRankingUseCase {
    private final RankingRepositoryPort rankingRepositoryPort;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void execute(String idGroup, String idStudent) {
        try {
            rankingRepositoryPort.lockGroup(idGroup);
        } catch (ResourceNotFoundException missingGroup) {
            return; // Preserve the existing idempotent DELETE contract for absent groups.
        }
        rankingRepositoryPort.deleteByGroupAndStudent(idGroup, idStudent);
        rankingRepositoryPort.sortRanking(idGroup);
    }
}
