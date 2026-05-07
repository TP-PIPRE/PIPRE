package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.CreateModuleCommand;

public interface CreateModuleUseCase {
    String execute(CreateModuleCommand cmd);
}
