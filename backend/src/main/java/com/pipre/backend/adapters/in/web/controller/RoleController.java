package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.RoleDTO;
import com.pipre.backend.application.commands.AssignRoleCommand;
import com.pipre.backend.application.ports.input.AssignRoleUseCase;
import com.pipre.backend.application.ports.input.GetRolesUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Tag(name = "Roles")
public class RoleController {

    private final AssignRoleUseCase assignRoleUseCase;
    private final GetRolesUseCase getRolesUseCase;

    @GetMapping
    @Operation(summary = "Obtener todos los roles")
    @ApiResponse(responseCode = "200", description = "Roles obtenidos exitosamente")
    public ResponseEntity<List<RoleDTO>> getRoles() {
        return ResponseEntity.ok(getRolesUseCase.execute());
    }

    @PostMapping("/user")
    @Operation(summary = "Asignar rol a un usuario")
    @ApiResponse(responseCode = "201", description = "Rol asignado exitosamente")
    public ResponseEntity<Void> assignRole(@RequestBody AssignRoleCommand command) {
        assignRoleUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}