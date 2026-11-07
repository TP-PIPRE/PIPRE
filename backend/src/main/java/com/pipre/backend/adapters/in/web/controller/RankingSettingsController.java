package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.application.useCases.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rankings")
@RequiredArgsConstructor
public class RankingSettingsController {
    private final AcademicAccessRepositoryPort access;
    private final AcademicAdministrationService administration;
    private final VerifiedRankingRepositoryPort rankings;
    private final RankingGamificationView gamification;
    public record Settings(@NotBlank String studentVisibility) {}
    @GetMapping("/settings") @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public Settings settings() {return new Settings(access.studentRankingVisibility());}
    @PutMapping("/settings") @PreAuthorize("hasRole('ADMIN')")
    public Settings settings(@Valid @RequestBody Settings request) {administration.rankingVisibility(request.studentVisibility());return settings();}
    @GetMapping("/global") @PreAuthorize("@academicAccess.globalRanking()")
    public List<RankingDTO> global() {return gamification.apply(rankings.global());}
}
