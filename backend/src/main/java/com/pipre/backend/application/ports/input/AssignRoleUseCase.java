package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.AssignRoleCommand;

public interface AssignRoleUseCase {
    void execute(AssignRoleCommand command);
}
