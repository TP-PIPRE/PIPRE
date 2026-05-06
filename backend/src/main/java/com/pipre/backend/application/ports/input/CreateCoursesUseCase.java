package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.CourseRequestDTO;

public interface CreateCoursesUseCase {
    void execute(CourseRequestDTO requestDTO);
}
