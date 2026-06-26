package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.StudentHistoryDTO;
import java.util.List;

public interface GetStudentHistoryUseCase {
    List<StudentHistoryDTO> execute(String idStudent);
}
