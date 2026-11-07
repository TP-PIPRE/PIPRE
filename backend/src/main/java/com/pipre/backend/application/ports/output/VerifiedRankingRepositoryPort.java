package com.pipre.backend.application.ports.output;

import com.pipre.backend.application.dto.RankingDTO;
import java.util.List;

public interface VerifiedRankingRepositoryPort {
    List<RankingDTO> global();
    List<RankingDTO> classroom(String groupId);
    List<RankingDTO> course(String courseId);
    List<RankingDTO> module(String moduleId);
}
