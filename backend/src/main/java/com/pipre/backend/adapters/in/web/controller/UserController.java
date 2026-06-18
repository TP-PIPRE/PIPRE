package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.UserDTO;
import com.pipre.backend.application.commands.RegisterUserCommand;
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

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Usuarios")
public class UserController {
    private final RegisterUserUseCase registerUserUseCase;
    private final GetUserByIdUseCase getUserByIdUseCase;

    @GetMapping("/{userId}")
    @Operation(summary = "Obtener usuario por ID")
    @ApiResponse(responseCode = "200", description = "Usuario obtenido exitosamente")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String userId) {
        UserDTO response = getUserByIdUseCase.execute(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Registrar nuevo usuario")
    @ApiResponse(responseCode = "201", description = "Usuario registrado exitosamente")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterUserCommand command) {
        String newUserId = registerUserUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUserId);
    }
}