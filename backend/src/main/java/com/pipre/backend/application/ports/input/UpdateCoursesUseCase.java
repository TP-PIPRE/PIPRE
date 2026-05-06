package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.CourseRequestDTO;

public interface UpdateCoursesUseCase {
    void execute(String idCourse, CourseRequestDTO requestDTO);
}
