package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.commands.AddStudentRankingCommand;
import com.pipre.backend.application.ports.input.AddStudentRankingUseCase;
import com.pipre.backend.application.ports.input.GetGroupRankingUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/group-students")
@RequiredArgsConstructor
@Tag(name = "Ranking", description = "Endpoints para la gestión del ranking de estudiantes en grupos")
public class RankingController {

    private final GetGroupRankingUseCase getGroupRankingUseCase;
    private final AddStudentRankingUseCase addStudentRankingUseCase;

    @GetMapping("/{idGroup}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener el ranking del grupo ordenado por posición")
    @ApiResponse(responseCode = "200", description = "Ranking obtenido exitosamente")
    public ResponseEntity<List<RankingDTO>> getGroupRanking(@PathVariable String idGroup) {
        return ResponseEntity.ok(getGroupRankingUseCase.execute(idGroup));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Asignar un estudiante a un grupo y registrar su ranking inicial")
    @ApiResponse(responseCode = "201", description = "Estudiante asignado y ranking creado/actualizado exitosamente")
    public ResponseEntity<Void> assignGroupStudent(@RequestBody AddStudentRankingCommand command) {
        addStudentRankingUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
