package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.RequestGameHintCommand;
import com.pipre.backend.application.dto.GameHintDTO;

public interface RequestGameHintUseCase {
    GameHintDTO execute(String studentId, String sessionId, RequestGameHintCommand command);
}
