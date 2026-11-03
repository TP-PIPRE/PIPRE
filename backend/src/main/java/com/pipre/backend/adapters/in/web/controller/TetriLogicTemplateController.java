package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.ports.input.GetTetriLogicTemplateUseCase;
import com.pipre.backend.domain.entities.activity.TetriLogicTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tetrilogic/templates")
@RequiredArgsConstructor
public class TetriLogicTemplateController {
    private final GetTetriLogicTemplateUseCase useCase;

    @GetMapping("/{templateId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<TetriLogicTemplate> get(@PathVariable String templateId) {
        return ResponseEntity.of(useCase.execute(templateId));
    }
}
