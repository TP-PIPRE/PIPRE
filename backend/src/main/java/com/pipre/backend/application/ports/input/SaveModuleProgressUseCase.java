package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.SaveModuleProgressCommand;

public interface SaveModuleProgressUseCase {
    String execute(SaveModuleProgressCommand command);
}
