package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.LessonDTO;

import java.util.List;

public interface GetLessonsUseCase {
    List<LessonDTO> execute(String idModule);
}
