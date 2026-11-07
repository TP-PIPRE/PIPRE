package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.ResultDTO;
import com.pipre.backend.application.commands.SaveResultCommand;
import com.pipre.backend.application.ports.input.GetStudentResultUseCase;
import com.pipre.backend.application.ports.input.SaveResultUseCase;
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
@RequestMapping("/api/v1/activity-results")
@RequiredArgsConstructor
@Tag(name = "Resultados", description = "Endpoints para la gestión de resultados de actividades")
public class ResultController {

    private final GetStudentResultUseCase getStudentResultUseCase;
    private final SaveResultUseCase saveResultUseCase;
    private final com.pipre.backend.application.useCases.IdempotentDeclarationService retries;

    @GetMapping("/user/{idStudent}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#idStudent) or (hasRole('TEACHER') and @academicAccess.readStudent(#idStudent))")
    @Operation(summary = "Obtener resultados de actividades por estudiante")
    @ApiResponse(responseCode = "200", description = "Resultados obtenidos exitosamente")
    public ResponseEntity<List<ResultDTO>> getStudentResult(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentResultUseCase.execute(idStudent));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#command.idStudent())")
    @Operation(summary = "Guardar un nuevo resultado de actividad")
    @ApiResponse(responseCode = "201", description = "Resultado guardado exitosamente")
    public ResponseEntity<Void> saveResult(@jakarta.validation.Valid @RequestBody SaveResultCommand command,@RequestHeader(value="Idempotency-Key",required=false) String key,org.springframework.security.core.Authentication authentication) {
        retries.execute(authentication.getName(),"activity-result",key,command,()->saveResultUseCase.execute(command));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

}
