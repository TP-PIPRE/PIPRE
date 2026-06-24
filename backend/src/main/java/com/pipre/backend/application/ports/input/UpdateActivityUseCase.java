package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.CreateActivityCommand;

public interface UpdateActivityUseCase {
    void execute(String idActivity, CreateActivityCommand cmd);
}
