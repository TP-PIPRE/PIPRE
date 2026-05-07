package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.RegisterCourseCommand;

public interface CreateCourseUseCase {
    String execute(RegisterCourseCommand cmd);
}
