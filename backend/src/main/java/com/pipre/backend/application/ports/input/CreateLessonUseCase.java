package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.CreateLessonCommand;

public interface CreateLessonUseCase {
    String execute(CreateLessonCommand cmd);
}
