package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.GameSessionAction;
import com.pipre.backend.application.commands.StartGameSessionCommand;
import com.pipre.backend.application.dto.GameCompletionDTO;
import com.pipre.backend.application.dto.GameSessionDTO;

public interface GameSessionsUseCase {
    java.util.Optional<GameSessionDTO> active(String studentId,String game,String template,String activityId,String dailyChallengeId);
    GameSessionDTO start(StartGameSessionCommand command);
    GameSessionDTO action(String studentId, String sessionId, GameSessionAction action);
    GameCompletionDTO complete(String studentId, String sessionId);
}
