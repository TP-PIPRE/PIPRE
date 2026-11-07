package com.pipre.backend.application.useCases;
import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.input.GetGroupRankingUseCase;
import com.pipre.backend.application.ports.output.VerifiedRankingRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Service
@RequiredArgsConstructor
public class GetGroupRankingService implements GetGroupRankingUseCase {
    private final VerifiedRankingRepositoryPort rankings;
    private final RankingGamificationView gamification;
    @Override @Transactional(readOnly=true)
    public List<RankingDTO> execute(String idGroup) {return gamification.apply(rankings.classroom(idGroup));}
}
