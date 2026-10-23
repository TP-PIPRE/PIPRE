package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.SaveAttemptRequestDTO;
import com.pipre.backend.application.ports.input.*;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.infrastructure.security.SecurityService;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudentOwnershipContractTest {
    @Configuration @EnableMethodSecurity
    static class Config {
        @Bean SecurityService securityService() { return mock(SecurityService.class); }
        @Bean SaveAttemptUseCase attempts() { return mock(SaveAttemptUseCase.class); }
        @Bean TelemetryController telemetry(SaveAttemptUseCase attempts) { return new TelemetryController(attempts); }
        @Bean ProfileController profile() { return new ProfileController(mock(GetStudentProfileUseCase.class), mock(GetStudentAchievementsUseCase.class), mock(GetStudentHistoryUseCase.class)); }
        @Bean ResultController results() { return new ResultController(mock(GetStudentResultUseCase.class), mock(SaveResultUseCase.class)); }
        @Bean SimulationController simulations() { return new SimulationController(mock(GetSimulationsUseCase.class), mock(CreateSimulationUseCase.class)); }
        @Bean ModuleProgressController progress() { return new ModuleProgressController(mock(SaveModuleProgressUseCase.class), mock(GetModuleProgressUseCase.class)); }
        @Bean HelpRequestController help() { return new HelpRequestController(mock(CreateHelpRequestUseCase.class), mock(GetHelpRequestsUseCase.class)); }
    }
    private AnnotationConfigApplicationContext context;
    @BeforeEach void setup() {
        context = new AnnotationConfigApplicationContext(Config.class);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("student@test.local", null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
        when(context.getBean(SecurityService.class).isCurrentUser("mine")).thenReturn(true);
    }
    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); context.close(); }
    private SaveAttemptRequestDTO attempt(String id) { return new SaveAttemptRequestDTO(id, "neonflow", "SUCCESS", 10, 2, 0, 0, "2026-10-23T20:00:00Z"); }
    @Test void acceptsOwnTelemetry() {
        assertEquals(201, context.getBean(TelemetryController.class).saveAttempt(attempt("mine")).getStatusCode().value());
    }
    @Test void rejectsAnotherStudentsTelemetry() {
        assertThrows(AccessDeniedException.class, () -> context.getBean(TelemetryController.class).saveAttempt(attempt("other")));
        verifyNoInteractions(context.getBean(SaveAttemptUseCase.class));
    }
    @Test void rejectsAnotherStudentsProfile() {
        assertThrows(AccessDeniedException.class, () -> context.getBean(ProfileController.class).getProfile("other"));
    }
    @Test void acceptsOwnProfile() {
        assertEquals(200, context.getBean(ProfileController.class).getProfile("mine").getStatusCode().value());
    }
    @Test void rejectsWritesForAnotherStudentAcrossAllStudentResources() {
        var result = mock(SaveResultCommand.class); when(result.idStudent()).thenReturn("other");
        var simulation = mock(CreateSimulationCommand.class); when(simulation.idStudent()).thenReturn("other");
        var progress = mock(SaveModuleProgressCommand.class); when(progress.idStudent()).thenReturn("other");
        var help = mock(CreateHelpRequestCommand.class); when(help.idStudent()).thenReturn("other");
        assertThrows(AccessDeniedException.class, () -> context.getBean(ResultController.class).saveResult(result));
        assertThrows(AccessDeniedException.class, () -> context.getBean(SimulationController.class).createSimulation(simulation));
        assertThrows(AccessDeniedException.class, () -> context.getBean(ModuleProgressController.class).saveModuleProgress(progress));
        assertThrows(AccessDeniedException.class, () -> context.getBean(HelpRequestController.class).createHelpRequest(help));
    }
    @Test void acceptsOwnWritesAcrossAllStudentResources() {
        var result = mock(SaveResultCommand.class); when(result.idStudent()).thenReturn("mine");
        var simulation = mock(CreateSimulationCommand.class); when(simulation.idStudent()).thenReturn("mine");
        var progress = mock(SaveModuleProgressCommand.class); when(progress.idStudent()).thenReturn("mine");
        var help = mock(CreateHelpRequestCommand.class); when(help.idStudent()).thenReturn("mine");
        assertEquals(201, context.getBean(ResultController.class).saveResult(result).getStatusCode().value());
        assertEquals(201, context.getBean(SimulationController.class).createSimulation(simulation).getStatusCode().value());
        assertEquals(200, context.getBean(ModuleProgressController.class).saveModuleProgress(progress).getStatusCode().value());
        assertEquals(201, context.getBean(HelpRequestController.class).createHelpRequest(help).getStatusCode().value());
    }
}
