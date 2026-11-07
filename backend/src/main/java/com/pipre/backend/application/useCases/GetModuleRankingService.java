package com.pipre.backend.application.useCases;
import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.input.GetModuleRankingUseCase;
import com.pipre.backend.application.ports.output.VerifiedRankingRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Service
@RequiredArgsConstructor
public class GetModuleRankingService implements GetModuleRankingUseCase {
    private final VerifiedRankingRepositoryPort rankings;
    private final RankingGamificationView gamification;
    @Override @Transactional(readOnly=true)
    public List<RankingDTO> execute(String moduleId) {return gamification.apply(rankings.module(moduleId));}
}
