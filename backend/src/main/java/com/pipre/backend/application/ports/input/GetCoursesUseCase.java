package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.CourseResponseDTO;

import java.util.List;

public interface GetCoursesUseCase {
    List<CourseResponseDTO> execute();
}
