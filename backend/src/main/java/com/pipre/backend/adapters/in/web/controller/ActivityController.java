package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.commands.CreateActivityCommand;
import com.pipre.backend.application.dto.ActivityDTO;
import com.pipre.backend.application.ports.input.CreateActivityUseCase;
import com.pipre.backend.application.ports.input.GetActivitiesUseCase;
import com.pipre.backend.application.ports.input.GetActivityUseCase;
import com.pipre.backend.application.ports.input.UpdateActivityUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
@Tag(name = "Actividades")
public class ActivityController {
    private final GetActivitiesUseCase getActivitiesUseCase;
    private final CreateActivityUseCase createActivityUseCase;
    private final GetActivityUseCase getActivityUseCase;
    private final UpdateActivityUseCase updateActivityUseCase;

    @GetMapping("/lesson/{idLesson}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener actividades por lección")
    @ApiResponse(responseCode = "200", description = "Actividades obtenidas exitosamente")
    public ResponseEntity<List<ActivityDTO>> getActivities(@PathVariable String idLesson) {
        return ResponseEntity.ok(getActivitiesUseCase.execute(idLesson));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener detalle técnico de una actividad específica")
    @ApiResponse(responseCode = "200", description = "Actividad obtenida exitosamente")
    public ResponseEntity<ActivityDTO> getActivity(@PathVariable String id) {
        return ResponseEntity.ok(getActivityUseCase.execute(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Crear una nueva actividad")
    @ApiResponse(responseCode = "201", description = "Actividad creada exitosamente")
    public ResponseEntity<Void> postActivity(@RequestBody CreateActivityCommand requestDTO) {
        createActivityUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Actualizar parámetros y misiones de una actividad")
    @ApiResponse(responseCode = "200", description = "Actividad actualizada exitosamente")
    public ResponseEntity<Void> putActivity(@PathVariable String id, @RequestBody CreateActivityCommand requestDTO) {
        updateActivityUseCase.execute(id, requestDTO);
        return ResponseEntity.ok().build();
    }
}
