package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterCourseCommand;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class CreateCourseServiceTest {
    @Test
    void rejectsCreatingCoursesOutsideTheOfficialCatalog() {
        var request = new RegisterCourseCommand("Robótica Educativa", "Descripción del curso", "LOW");
        assertThrows(BusinessException.class, () -> new CreateCourseService().execute(request));
    }
}
