package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterUserCommand;
import com.pipre.backend.application.ports.output.PasswordEncoderPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegisterUserServiceTest {

    @Mock private UserRepositoryPort userRepositoryPort;
    @Mock private PasswordEncoderPort passwordEncoderPort;
    @InjectMocks private RegisterUserService registerUserService;

    @Test
    @DisplayName("Debería registrar un usuario con la contraseña cifrada")
    void shouldRegisterUserWithEncodedPassword() {
        // Arrange
        RegisterUserCommand cmd = new RegisterUserCommand(
                "Luis", "García", "luis@pipre.com", "password123", "6to", 12, List.of("role-uuid")
        );
        when(userRepositoryPort.existsByEmail(cmd.email())).thenReturn(false);
        when(passwordEncoderPort.encode("password123")).thenReturn("hashed_password_xyz");

        // Act
        String resultId = registerUserService.execute(cmd);

        // Assert
        assertNotNull(resultId);
        verify(passwordEncoderPort).encode("password123");
        verify(userRepositoryPort).save(argThat(user ->
                user.getEmail().equals("luis@pipre.com") &&
                        user.getPasswordHash().equals("hashed_password_xyz")
        ));
    }

    @Test
    @DisplayName("Debería lanzar excepción si el email ya existe")
    void shouldThrowExceptionWhenEmailExists() {
        RegisterUserCommand cmd = new RegisterUserCommand(
                "A",
                "B",
                "exists@p.com",
                "1",
                "1",
                10, List.of());
        when(userRepositoryPort.existsByEmail("exists@p.com")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> registerUserService.execute(cmd));
        verify(userRepositoryPort, never()).save(any());
    }
}
