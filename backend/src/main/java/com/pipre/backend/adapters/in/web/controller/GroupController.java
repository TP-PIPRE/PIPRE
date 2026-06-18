package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.ports.input.GetGroupsUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener todos los grupos")
    @ApiResponse(responseCode = "200", description = "Grupos obtenidos exitosamente")
    public ResponseEntity<List<GroupDTO>> getGroups() {
        return ResponseEntity.ok(getGroupsUseCase.execute());
    }
}
