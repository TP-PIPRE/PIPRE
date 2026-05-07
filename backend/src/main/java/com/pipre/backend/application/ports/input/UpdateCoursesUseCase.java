package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.RegisterCourseCommand;

public interface UpdateCoursesUseCase {
    void execute(String idCourse, RegisterCourseCommand requestDTO);
}
