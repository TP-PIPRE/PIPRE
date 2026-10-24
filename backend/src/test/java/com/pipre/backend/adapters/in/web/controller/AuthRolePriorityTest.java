package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.LoginRequestDTO;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.role.Role;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.infrastructure.configuration.BrowserSecurityProperties;
import com.pipre.backend.infrastructure.security.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.TestingAuthenticationToken;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthRolePriorityTest {
    @Test void selectsAdminEvenWhenStudentRoleIsStoredFirst() {
        var manager = mock(AuthenticationManager.class); var jwt = mock(JwtUtils.class);
        var users = mock(UserRepositoryPort.class); var roles = mock(RoleRepositoryPort.class);
        when(manager.authenticate(any())).thenReturn(new TestingAuthenticationToken("user@example.com", "secret", "ROLE_STUDENT", "ROLE_ADMIN"));
        when(jwt.createToken(anyString(), anyList())).thenReturn("signed-token");
        var user = mock(User.class); when(user.getIdRoleList()).thenReturn(List.of("student", "admin"));
        when(users.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        var student = mock(Role.class); when(student.getIdRole()).thenReturn("student"); when(student.getName()).thenReturn("STUDENT");
        var admin = mock(Role.class); when(admin.getIdRole()).thenReturn("admin"); when(admin.getName()).thenReturn("ADMIN");
        when(roles.findAll()).thenReturn(List.of(student, admin));
        var controller = new AuthController(manager, jwt, users, roles, new BrowserSecurityProperties());
        var response = controller.login(new LoginRequestDTO("user@example.com", "secret"));
        assertEquals("admin", response.getBody().user().role());
        assertTrue(response.getHeaders().getFirst("Set-Cookie").contains("HttpOnly"));
    }
}
