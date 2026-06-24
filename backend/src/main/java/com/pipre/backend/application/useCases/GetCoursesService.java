package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.CourseDTO;
import com.pipre.backend.application.ports.input.GetCoursesUseCase;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetCoursesService implements GetCoursesUseCase {
    private final CourseRepositoryPort repositoryPort;

    @Override
    @Transactional(readOnly = true)
    public Page<CourseDTO> execute(Pageable pageable) {
        return repositoryPort.findAll(pageable)
                .map(course -> new CourseDTO(
                        course.getIdCourse(),
                        course.getName()
                ));
    }
}
