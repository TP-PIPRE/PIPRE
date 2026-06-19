package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.ResultDTO;

import java.util.List;

public interface GetStudentResultUseCase {
    List<ResultDTO> execute(String idStudent);
}
