package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.LessonResponseDTO;

import java.util.List;

public interface GetLessonsUseCase {
    List<LessonResponseDTO> execute(String idModule);
}
