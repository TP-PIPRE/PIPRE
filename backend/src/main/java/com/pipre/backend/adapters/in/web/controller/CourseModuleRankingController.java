package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.input.GetCourseRankingUseCase;
import com.pipre.backend.application.ports.input.GetModuleRankingUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ranking")
@RequiredArgsConstructor
@Tag(name = "Ranking por Curso/Módulo", description = "Endpoints para ranking filtrado por curso o módulo")
public class CourseModuleRankingController {

    private final GetCourseRankingUseCase getCourseRankingUseCase;
    private final GetModuleRankingUseCase getModuleRankingUseCase;

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener ranking de estudiantes filtrado por curso")
    @ApiResponse(responseCode = "200", description = "Ranking del curso obtenido exitosamente")
    public ResponseEntity<List<RankingDTO>> getCourseRanking(@PathVariable String courseId) {
        return ResponseEntity.ok(getCourseRankingUseCase.execute(courseId));
    }

    @GetMapping("/module/{moduleId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener ranking de estudiantes filtrado por módulo")
    @ApiResponse(responseCode = "200", description = "Ranking del módulo obtenido exitosamente")
    public ResponseEntity<List<RankingDTO>> getModuleRanking(@PathVariable String moduleId) {
        return ResponseEntity.ok(getModuleRankingUseCase.execute(moduleId));
    }
}
