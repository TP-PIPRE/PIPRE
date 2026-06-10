package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.AssignRoleCommand;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignRoleServiceTest {

    @Mock
    private UserRepositoryPort userRepositoryPort;

    @Mock
    private RoleRepositoryPort roleRepositoryPort;

    @InjectMocks
    private AssignRoleService assignRoleService;

    @Test
    @DisplayName("Debería asignar un rol a un usuario exitosamente")
    void shouldAssignRoleSuccessfully() {
        // Arrange (Preparación)
        String userId = "user-123";
        String roleId = "role-456";
        AssignRoleCommand command = new AssignRoleCommand(userId, roleId);

        // Creamos un usuario de dominio
        User user = new User.Builder()
                .idUser(userId)
                .email("test@pipre.com")
                .idRoleList(new ArrayList<>(List.of("OLD_ROLE")))
                .build();

        // Configuramos el comportamiento de los Mocks
        when(userRepositoryPort.findById(userId)).thenReturn(Optional.of(user));
        when(roleRepositoryPort.existsById(roleId)).thenReturn(true);

        // Act (Acción)
        assignRoleService.execute(command);

        // Assert (Verificación)
        // Verificamos que se llamó al save con el usuario actualizado
        verify(userRepositoryPort, times(1)).save(argThat(updatedUser ->
                updatedUser.getIdRoleList().contains(roleId) &&
                        updatedUser.getIdRoleList().size() == 2
        ));
    }

    @Test
    @DisplayName("Debería lanzar excepción cuando el rol no existe")
    void shouldThrowExceptionWhenRoleNotFound() {
        // Arrange
        String userId = "user-123";
        String roleId = "invalid-role";
        AssignRoleCommand command = new AssignRoleCommand(userId, roleId);

        User user = new User.Builder().idUser(userId).email("a@a.com").build();

        when(userRepositoryPort.findById(userId)).thenReturn(Optional.of(user));
        when(roleRepositoryPort.existsById(roleId)).thenReturn(false);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            assignRoleService.execute(command);
        });

        assertEquals("El rol no existe", exception.getMessage());
        verify(userRepositoryPort, never()).save(any());
    }
}