package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.CourseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GetCoursesUseCase {
    Page<CourseDTO> execute(Pageable pageable);
}
