package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.CourseDTO;

import java.util.List;

public interface GetCoursesUseCase {
    List<CourseDTO> execute();
}
