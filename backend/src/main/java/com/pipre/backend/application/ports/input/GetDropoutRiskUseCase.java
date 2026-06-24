package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.DropoutRiskDTO;

public interface GetDropoutRiskUseCase {
    DropoutRiskDTO execute(String idStudent);
}
