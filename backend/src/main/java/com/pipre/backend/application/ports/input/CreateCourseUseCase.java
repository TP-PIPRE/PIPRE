package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.RegisterCourseCommand;

public interface CreateCourseUseCase {
    String execute(RegisterCourseCommand cmd);
}
