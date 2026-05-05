package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.usecases.commands.RegisterUserCommand;

public interface RegisterUserUseCase {

    String execute(RegisterUserCommand command);

}
