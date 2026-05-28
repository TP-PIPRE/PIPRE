package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.RegisterUserCommand;

public interface RegisterUserUseCase {
    String execute(RegisterUserCommand command);
}
