package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.CourseResponseDTO;
import com.pipre.backend.application.ports.input.GetCoursesUseCase;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetCoursesService implements GetCoursesUseCase {

    private final CourseRepositoryPort repositoryPort;

    @Override
    public List<CourseResponseDTO> execute() {
        return repositoryPort.findAll()
                .stream()
                .map(course -> new CourseResponseDTO(
                        course.getIdCourse(),
                        course.getName()
                ))
                .toList();
    }
}
