package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.AchievementDTO;
import com.pipre.backend.application.dto.PlayerProfileDTO;
import com.pipre.backend.application.dto.StudentHistoryDTO;
import com.pipre.backend.application.dto.GameProgressDTO;
import com.pipre.backend.application.dto.AchievementExportDTO;
import com.pipre.backend.application.ports.input.GetGameProgressUseCase;
import com.pipre.backend.application.ports.input.ExportAchievementsUseCase;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
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
    private final GetGameProgressUseCase getGameProgressUseCase;
    private final ExportAchievementsUseCase exportAchievementsUseCase;

    @GetMapping("/{idStudent}/game-progress")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    public GameProgressDTO gameProgress(@PathVariable String idStudent) { return getGameProgressUseCase.progress(idStudent); }

    @GetMapping("/{idStudent}/achievements/export")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    public AchievementExportDTO export(@PathVariable String idStudent,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {
        return exportAchievementsUseCase.export(idStudent,from,to);
    }

    @GetMapping("/{idStudent}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    @Operation(summary = "Obtener perfil completo del estudiante con estadísticas de gamificación")
    public ResponseEntity<PlayerProfileDTO> getProfile(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentProfileUseCase.execute(idStudent));
    }

    @GetMapping("/{idStudent}/achievements")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    @Operation(summary = "Obtener logros del estudiante (todos con estado desbloqueado/bloqueado)")
    public ResponseEntity<List<AchievementDTO>> getAchievements(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentAchievementsUseCase.execute(idStudent));
    }

    @GetMapping("/{idStudent}/history")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    @Operation(summary = "Obtener historial de resultados con estrellas y XP")
    public ResponseEntity<List<StudentHistoryDTO>> getHistory(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentHistoryUseCase.execute(idStudent));
    }
}
