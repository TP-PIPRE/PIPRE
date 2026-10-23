package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.RegisterUserRequestDTO;
import com.pipre.backend.application.ports.input.*;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.domain.entities.role.Role;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class UserRegistrationContractTest {
    private final RegisterUserUseCase register = mock(RegisterUserUseCase.class);
    private final RoleRepositoryPort roles = mock(RoleRepositoryPort.class);
    private final UserController controller = new UserController(register, mock(GetUserByIdUseCase.class), mock(GetAllUsersUseCase.class), roles);

    private RegisterUserRequestDTO request(List<String> ids) {
        when(roles.findAll()).thenReturn(List.of(Role.builder().idRole("student-role").name("STUDENT").description("").build()));
        return new RegisterUserRequestDTO("Ana", "Prueba", "ana@test.local", "123", "5to", 15, ids);
    }
    @Test void publicRegistrationAssignsStudentWhenRoleIdsAreEmpty() {
        when(register.execute(any())).thenReturn("new-user");
        var result = controller.registerUser(request(List.of()), null);
        assertEquals(201, result.getStatusCode().value());
        assertEquals("new-user", result.getBody());
        verify(register).execute(argThat(c -> c.roleIdList().equals(List.of("student-role"))));
    }
    @Test void publicRegistrationCannotChoosePrivilegedRoles() {
        assertThrows(AccessDeniedException.class, () -> controller.registerUser(request(List.of("admin-role")), null));
        verifyNoInteractions(register);
    }
    @Test void authenticatedAdminCanAssignAnExplicitRole() {
        var admin = new UsernamePasswordAuthenticationToken("admin", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        controller.registerUser(request(List.of("teacher-role")), admin);
        verify(register).execute(argThat(c -> c.roleIdList().equals(List.of("teacher-role"))));
    }
}
