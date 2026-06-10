package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.SaveResultCommand;

public interface SaveResultUseCase {
    String execute(SaveResultCommand command);
}
