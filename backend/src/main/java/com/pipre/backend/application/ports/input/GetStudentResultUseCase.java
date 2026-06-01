package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.StudentResultResponseDTO;

import java.util.List;

public interface GetStudentResultUseCase {
    List<StudentResultResponseDTO> execute(String idStudent);
}
