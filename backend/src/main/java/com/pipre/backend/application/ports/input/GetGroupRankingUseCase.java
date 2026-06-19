package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.RankingDTO;

import java.util.List;

public interface GetGroupRankingUseCase {
    List<RankingDTO> execute(String idGroup);
}
