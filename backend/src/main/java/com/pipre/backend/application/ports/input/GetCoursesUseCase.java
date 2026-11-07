package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.CourseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GetCoursesUseCase {
    Page<CourseDTO> execute(Pageable pageable);
    default Page<CourseDTO> visible(java.util.Set<String> ids,Pageable pageable) {throw new UnsupportedOperationException("Scoped catalog not implemented");}
}
