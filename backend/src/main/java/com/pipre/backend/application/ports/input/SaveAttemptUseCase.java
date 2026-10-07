package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.SaveAttemptCommand;

public interface SaveAttemptUseCase {
    void execute(SaveAttemptCommand command);
}
