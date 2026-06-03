package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.RankingResponseDTO;

import java.util.List;

public interface GetGroupRankingUseCase {
    List<RankingResponseDTO> execute(String idGroup);
}
