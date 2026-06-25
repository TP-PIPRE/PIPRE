package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateHelpRequestCommand;
import com.pipre.backend.application.ports.output.HelpRequestRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CreateHelpRequestServiceTest {

    @Mock
    private HelpRequestRepositoryPort helpRequestRepositoryPort;

    @InjectMocks
    private CreateHelpRequestService createHelpRequestService;

    @Test
    @DisplayName("Debería crear una solicitud de ayuda correctamente")
    void shouldCreateHelpRequestSuccessfully() {
        // Arrange
        CreateHelpRequestCommand cmd = new CreateHelpRequestCommand("student-123", 3);

        // Act
        String helpRequestId = createHelpRequestService.execute(cmd);

        // Assert
        assertNotNull(helpRequestId);
        verify(helpRequestRepositoryPort, times(1)).save(argThat(hr ->
                hr.getIdStudent().equals(cmd.idStudent()) &&
                        hr.getAiInteractions().equals(cmd.aiInteractions()) &&
                        hr.getIdHelpRequest().equals(helpRequestId)
        ));
    }
}
