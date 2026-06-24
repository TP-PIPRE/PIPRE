package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.LessonDTO;
import com.pipre.backend.application.commands.CreateLessonCommand;
import com.pipre.backend.application.ports.input.CreateLessonUseCase;
import com.pipre.backend.application.ports.input.GetLessonsUseCase;
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
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
@Tag(name = "Lecciones")
public class LessonController {

    private final GetLessonsUseCase getLessonsUseCase;
    private final CreateLessonUseCase createLessonUseCase;

    @GetMapping("/module/{idModule}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener todas las lecciones de un módulo")
    @ApiResponse(responseCode = "200", description = "Lecciones obtenidas exitosamente")
    public ResponseEntity<List<LessonDTO>> getLessons(@PathVariable String idModule) {
        return ResponseEntity.ok(getLessonsUseCase.execute(idModule));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Crear una nueva lección")
    @ApiResponse(responseCode = "201", description = "Lección creada exitosamente")
    public ResponseEntity<Void> postLesson(@RequestBody CreateLessonCommand requestDTO) {
        createLessonUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
