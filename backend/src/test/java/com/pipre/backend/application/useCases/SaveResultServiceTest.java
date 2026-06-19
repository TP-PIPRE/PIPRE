package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.SaveResultCommand;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SaveResultServiceTest {

    @Mock
    private ResultRepositoryPort resultRepositoryPort;

    @InjectMocks
    private SaveResultService saveResultService;

    @Test
    @DisplayName("Debería guardar un resultado correctamente y retornar su ID")
    void shouldSaveResultSuccessfully() {
        // Arrange
        SaveResultCommand cmd = new SaveResultCommand(
                "student-123",
                "activity-456",
                BigDecimal.valueOf(9.5),
                3
        );

        // Act
        String resultId = saveResultService.execute(cmd);

        // Assert
        assertNotNull(resultId);
        verify(resultRepositoryPort, times(1)).save(argThat(result ->
                result.getIdStudent().equals(cmd.idStudent()) &&
                        result.getIdActivity().equals(cmd.idActivity()) &&
                        result.getAttempts().equals(cmd.attempts()) &&
                        result.getScore().equals(cmd.score()) &&
                        result.getIdResult().equals(resultId)
        ));
    }
}
