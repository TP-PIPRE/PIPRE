package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.CreateLessonCommand;

public interface CreateLessonUseCase {
    String execute(CreateLessonCommand cmd);
}
