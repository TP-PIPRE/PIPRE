package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.HelpRequestDTO;
import com.pipre.backend.application.ports.output.HelpRequestRepositoryPort;
import com.pipre.backend.domain.entities.helprequest.HelpRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetHelpRequestsServiceTest {

    @Mock
    private HelpRequestRepositoryPort helpRequestRepositoryPort;

    @InjectMocks
    private GetHelpRequestsService getHelpRequestsService;

    @Test
    @DisplayName("Debería obtener la lista de solicitudes de ayuda de un estudiante")
    void shouldGetHelpRequestsSuccessfully() {
        // Arrange
        String idStudent = "student-123";
        HelpRequest hr1 = HelpRequest.builder()
                .idHelpRequest("req-1")
                .aiInteractions(3)
                .requestedAt(LocalDateTime.now())
                .idStudent(idStudent)
                .build();
        HelpRequest hr2 = HelpRequest.builder()
                .idHelpRequest("req-2")
                .aiInteractions(5)
                .requestedAt(LocalDateTime.now())
                .idStudent(idStudent)
                .build();

        when(helpRequestRepositoryPort.findAllByIdStudent(idStudent)).thenReturn(List.of(hr1, hr2));

        // Act
        List<HelpRequestDTO> result = getHelpRequestsService.execute(idStudent);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("req-1", result.get(0).idHelpRequest());
        assertEquals(3, result.get(0).aiInteractions());
        assertEquals("req-2", result.get(1).idHelpRequest());
        assertEquals(5, result.get(1).aiInteractions());
    }
}
