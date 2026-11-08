package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterCourseCommand;
import com.pipre.backend.application.ports.input.CreateCourseUseCase;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.springframework.stereotype.Service;

@Service
public class CreateCourseService implements CreateCourseUseCase {

    @Override
    public String execute(RegisterCourseCommand cmd) {
        throw new BusinessException("El catálogo solo admite los cursos oficiales Neon Flow y TetriLogic.");
    }
}
