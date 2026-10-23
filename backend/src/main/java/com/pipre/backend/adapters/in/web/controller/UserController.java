package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.UserDTO;
import com.pipre.backend.application.commands.RegisterUserCommand;
import com.pipre.backend.adapters.in.web.dto.RegisterUserRequestDTO;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import com.pipre.backend.application.ports.input.GetAllUsersUseCase;
import com.pipre.backend.application.ports.input.GetUserByIdUseCase;
import com.pipre.backend.application.ports.input.RegisterUserUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Usuarios")
public class UserController {
    private final RegisterUserUseCase registerUserUseCase;
    private final GetUserByIdUseCase getUserByIdUseCase;
    private final GetAllUsersUseCase getAllUsersUseCase;
    private final RoleRepositoryPort roleRepositoryPort;

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Listar todos los usuarios")
    @ApiResponse(responseCode = "200", description = "Usuarios obtenidos exitosamente")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = getAllUsersUseCase.execute();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#userId)")
    @Operation(summary = "Obtener usuario por ID")
    @ApiResponse(responseCode = "200", description = "Usuario obtenido exitosamente")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String userId) {
        UserDTO response = getUserByIdUseCase.execute(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Registrar nuevo usuario")
    @ApiResponse(responseCode = "201", description = "Usuario registrado exitosamente")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterUserRequestDTO request, Authentication authentication) {
        boolean admin = authentication != null && authentication.isAuthenticated()
                && authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        String studentRoleId = roleRepositoryPort.findAll().stream()
                .filter(r -> "STUDENT".equalsIgnoreCase(r.getName()))
                .map(r -> r.getIdRole()).findFirst()
                .orElseThrow(() -> new IllegalStateException("El rol STUDENT no está configurado."));
        List<String> roleIds = request.roleIdList();
        if (roleIds == null || roleIds.isEmpty()) roleIds = List.of(studentRoleId);
        if (!admin && roleIds.stream().anyMatch(id -> !studentRoleId.equals(id))) {
            throw new AccessDeniedException("El registro público sólo permite cuentas de estudiante.");
        }
        RegisterUserCommand command = new RegisterUserCommand(request.firstName(), request.lastName(),
                request.email(), request.passwordHash(), request.grade(), request.age(), roleIds);
        String newUserId = registerUserUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUserId);
    }
}
