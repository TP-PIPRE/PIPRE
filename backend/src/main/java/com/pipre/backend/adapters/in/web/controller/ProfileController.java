package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.AchievementDTO;
import com.pipre.backend.application.dto.PlayerProfileDTO;
import com.pipre.backend.application.dto.StudentHistoryDTO;
import com.pipre.backend.application.ports.input.GetStudentAchievementsUseCase;
import com.pipre.backend.application.ports.input.GetStudentHistoryUseCase;
import com.pipre.backend.application.ports.input.GetStudentProfileUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Perfil", description = "Endpoints para el perfil de estudiante y gamificación")
public class ProfileController {

    private final GetStudentProfileUseCase getStudentProfileUseCase;
    private final GetStudentAchievementsUseCase getStudentAchievementsUseCase;
    private final GetStudentHistoryUseCase getStudentHistoryUseCase;

    @GetMapping("/{idStudent}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener perfil completo del estudiante con estadísticas de gamificación")
    public ResponseEntity<PlayerProfileDTO> getProfile(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentProfileUseCase.execute(idStudent));
    }

    @GetMapping("/{idStudent}/achievements")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener logros del estudiante (todos con estado desbloqueado/bloqueado)")
    public ResponseEntity<List<AchievementDTO>> getAchievements(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentAchievementsUseCase.execute(idStudent));
    }

    @GetMapping("/{idStudent}/history")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener historial de resultados con estrellas y XP")
    public ResponseEntity<List<StudentHistoryDTO>> getHistory(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentHistoryUseCase.execute(idStudent));
    }
}
