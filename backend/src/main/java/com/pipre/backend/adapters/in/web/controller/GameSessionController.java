package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.commands.GameSessionAction;
import com.pipre.backend.application.commands.StartGameSessionCommand;
import com.pipre.backend.application.dto.GameCompletionDTO;
import com.pipre.backend.application.dto.GameSessionDTO;
import com.pipre.backend.application.ports.input.GameSessionsUseCase;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/game-sessions")
@RequiredArgsConstructor
public class GameSessionController {
    private final GameSessionsUseCase sessions;
    private final UserRepositoryPort users;

    @GetMapping("/active")
    @PreAuthorize("hasRole('STUDENT') and !hasAnyRole('ADMIN','TEACHER') and @securityService.isCurrentUser(#studentId)")
    public ResponseEntity<GameSessionDTO> active(@RequestParam String studentId,@RequestParam String game,@RequestParam String levelTemplate,
            @RequestParam(required=false) String activityId,@RequestParam(required=false) String dailyChallengeId) {
        return sessions.active(studentId,game,levelTemplate,activityId,dailyChallengeId).map(ResponseEntity::ok).orElseGet(()->ResponseEntity.noContent().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT') and !hasAnyRole('ADMIN','TEACHER') and @securityService.isCurrentUser(#request.studentId())")
    public ResponseEntity<GameSessionDTO> start(@Valid @RequestBody StartGameSessionCommand request) {
        return ResponseEntity.ok(sessions.start(request));
    }
    @PostMapping("/{sessionId}/actions")
    @PreAuthorize("hasRole('STUDENT') and !hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<GameSessionDTO> action(@PathVariable String sessionId,@Valid @RequestBody GameSessionAction request,Authentication authentication) {
        return ResponseEntity.ok(sessions.action(current(authentication),sessionId,request));
    }
    @PostMapping("/{sessionId}/complete")
    @PreAuthorize("hasRole('STUDENT') and !hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<GameCompletionDTO> complete(@PathVariable String sessionId,Authentication authentication) {
        return ResponseEntity.ok(sessions.complete(current(authentication),sessionId));
    }
    private String current(Authentication authentication) {
        return users.findByEmail(authentication.getName()).orElseThrow(()->new AccessDeniedException("Inicia sesión como estudiante.")).getIdUser();
    }
}
