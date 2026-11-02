package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.VerifiedVictory;
import com.pipre.backend.application.dto.VictoryAwardsDTO;

public interface RecordVerifiedVictoryUseCase {
    VictoryAwardsDTO execute(VerifiedVictory victory);
}
