package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.HelpRequestDTO;
import java.util.List;

public interface GetHelpRequestsUseCase {
    List<HelpRequestDTO> execute(String idStudent);
}
