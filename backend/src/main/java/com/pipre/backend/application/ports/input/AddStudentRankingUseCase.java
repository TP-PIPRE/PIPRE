package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.RankingRequestDTO;

public interface AddStudentRankingUseCase {
    void execute(RankingRequestDTO requestDTO);
}
