package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.CreateHelpRequestCommand;

public interface CreateHelpRequestUseCase {
    String execute(CreateHelpRequestCommand command);
}
