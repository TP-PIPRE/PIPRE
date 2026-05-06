package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.LessonRequestDTO;

public interface CreateLessonsUseCase {
    void execute(LessonRequestDTO requestDTO);
}
