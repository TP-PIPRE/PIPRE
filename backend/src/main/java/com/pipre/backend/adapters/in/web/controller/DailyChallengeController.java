package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.DailyChallengeDTO;
import com.pipre.backend.application.ports.input.DailyChallengeUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/daily-challenges")
@RequiredArgsConstructor
public class DailyChallengeController {
    private final DailyChallengeUseCase dailyChallengeUseCase;
    private final com.pipre.backend.application.useCases.ProceduralDailyService procedural;
    @GetMapping("/today/set")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#studentId) or (hasRole('TEACHER') and @academicAccess.readStudent(#studentId))")
    public com.pipre.backend.application.useCases.ProceduralDailyService.DailySet set(@RequestParam String studentId) { return procedural.today(studentId); }
    @GetMapping("/today")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#studentId) or (hasRole('TEACHER') and @academicAccess.readStudent(#studentId))")
    public DailyChallengeDTO today(@RequestParam String studentId) { return dailyChallengeUseCase.today(studentId); }
}
