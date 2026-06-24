package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.HelpRequestDTO;
import com.pipre.backend.application.ports.input.GetHelpRequestsUseCase;
import com.pipre.backend.application.ports.output.HelpRequestRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetHelpRequestsService implements GetHelpRequestsUseCase {

    private final HelpRequestRepositoryPort helpRequestRepositoryPort;

    @Override
    public List<HelpRequestDTO> execute(String idStudent) {
        return helpRequestRepositoryPort.findAllByIdStudent(idStudent)
                .stream()
                .map(hr -> new HelpRequestDTO(
                        hr.getIdHelpRequest(),
                        hr.getAiInteractions(),
                        hr.getRequestedAt(),
                        hr.getIdStudent()
                ))
                .toList();
    }
}
