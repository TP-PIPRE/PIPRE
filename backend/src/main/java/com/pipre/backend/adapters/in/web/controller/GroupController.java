package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.ports.input.GetGroupsUseCase;
import com.pipre.backend.application.ports.input.GetGroupUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
@Tag(name = "Grupos")
public class GroupController {

    private final GetGroupsUseCase getGroupsUseCase;
    private final GetGroupUseCase getGroupUseCase;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener todos los grupos")
    @ApiResponse(responseCode = "200", description = "Grupos obtenidos exitosamente")
    public ResponseEntity<List<GroupDTO>> getGroups() {
        return ResponseEntity.ok(getGroupsUseCase.execute());
    }

    @GetMapping("/{idGroup}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener un grupo por su ID")
    @ApiResponse(responseCode = "200", description = "Grupo obtenido exitosamente")
    public ResponseEntity<GroupDTO> getGroupById(@PathVariable String idGroup) {
        return ResponseEntity.ok(getGroupUseCase.execute(idGroup));
    }
}
