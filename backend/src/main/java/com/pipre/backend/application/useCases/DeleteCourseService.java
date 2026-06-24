package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.input.DeleteCourseUseCase;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeleteCourseService implements DeleteCourseUseCase {

    private final CourseRepositoryPort courseRepositoryPort;

    @Override
    @Transactional
    public void execute(String idCourse) {
        courseRepositoryPort.findById(idCourse)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el curso con ID: " + idCourse));
        courseRepositoryPort.deleteById(idCourse);
    }
}
