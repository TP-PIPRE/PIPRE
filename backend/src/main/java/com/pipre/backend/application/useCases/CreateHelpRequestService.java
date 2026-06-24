package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateHelpRequestCommand;
import com.pipre.backend.application.ports.input.CreateHelpRequestUseCase;
import com.pipre.backend.application.ports.output.HelpRequestRepositoryPort;
import com.pipre.backend.domain.entities.helprequest.HelpRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreateHelpRequestService implements CreateHelpRequestUseCase {

    private final HelpRequestRepositoryPort helpRequestRepositoryPort;

    @Override
    public String execute(CreateHelpRequestCommand command) {
        HelpRequest helpRequest = HelpRequest.builder()
                .idHelpRequest(UUID.randomUUID().toString())
                .aiInteractions(command.aiInteractions())
                .requestedAt(LocalDateTime.now())
                .idStudent(command.idStudent())
                .build();
        helpRequestRepositoryPort.save(helpRequest);
        return helpRequest.getIdHelpRequest();
    }
}
