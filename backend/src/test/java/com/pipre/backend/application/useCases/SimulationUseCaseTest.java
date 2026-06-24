package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateSimulationCommand;
import com.pipre.backend.application.dto.SimulationDTO;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.SimulationRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.simulation.Simulation;
import com.pipre.backend.domain.entities.simulation.SimulationResult;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimulationUseCaseTest {

    @Mock
    private SimulationRepositoryPort repositoryPort;

    @Mock
    private UserRepositoryPort userRepositoryPort;

    @Mock
    private ActivityRepositoryPort activityRepositoryPort;

    @InjectMocks
    private CreateSimulationService createSimulationService;

    @InjectMocks
    private GetSimulationsService getSimulationsService;

    @Test
    @DisplayName("Debería crear una simulación exitosamente con resultado válido")
    void shouldCreateSimulationSuccessfully() {
        CreateSimulationCommand cmd = new CreateSimulationCommand(
                "SUCCESS", "student-1", "activity-1",
                "code blockly", "pseudocodigo", "diagrama",
                5, 3, 0.1, 45000,
                "obstacle", List.of(), null, null
        );

        String simulationId = createSimulationService.execute(cmd);

        assertNotNull(simulationId);
        verify(repositoryPort, times(1)).save(argThat(s -> s.getResult() == SimulationResult.SUCCESS &&
                s.getIdStudent().equals("student-1") &&
                s.getIdActivity().equals("activity-1") &&
                s.getBlocksUsage().equals(5) &&
                s.getSensorError().equals(0.1) &&
                s.getPredictedScore() != null));
    }

    @Test
    @DisplayName("Debería lanzar excepción si el resultado es inválido al crear simulación")
    void shouldThrowExceptionForInvalidResult() {
        CreateSimulationCommand cmd = new CreateSimulationCommand(
                "INVALID", "student-1", "activity-1",
                null, null, null, null, null, null, null,
                null, null, null, null
        );

        assertThrows(BusinessException.class, () -> createSimulationService.execute(cmd));
        verify(repositoryPort, never()).save(any());
    }

    @Test
    @DisplayName("Debería obtener las simulaciones de un estudiante mapeadas a DTO")
    void shouldGetSimulationsForStudent() {
        Simulation simulation = Simulation.builder()
                .idSimulation("sim-1")
                .result(SimulationResult.FAILURE)
                .idStudent("student-1")
                .idActivity("activity-1")
                .blocksUsage(4)
                .sensorError(0.2)
                .predictedScore(40)
                .build();

        User student = User.builder()
                .idUser("student-1")
                .firstName("Juan")
                .lastName("Perez")
                .email("juan@mail.com")
                .isActive(true)
                .build();

        Activity activity = Activity.builder()
                .idActivity("activity-1")
                .name("Actividad Maze")
                .environment("maze")
                .startX(0.0)
                .startZ(0.0)
                .targetX(10.0)
                .targetZ(10.0)
                .missions(List.of())
                .idLesson("lesson-1")
                .build();

        when(userRepositoryPort.findById("student-1")).thenReturn(Optional.of(student));
        when(activityRepositoryPort.findById("activity-1")).thenReturn(Optional.of(activity));
        when(repositoryPort.getAllByStudentId("student-1")).thenReturn(List.of(simulation));

        List<SimulationDTO> result = getSimulationsService.execute("student-1");

        assertFalse(result.isEmpty());
        assertEquals("sim-1", result.getFirst().idSimulation());
        assertEquals("FAILURE", result.getFirst().result());
        assertEquals("Juan", result.getFirst().student().firstName());
        assertEquals("Actividad Maze", result.getFirst().activity().name());
        assertEquals("maze", result.getFirst().environment());
        assertEquals(40, result.getFirst().predictedScore());
    }
}
