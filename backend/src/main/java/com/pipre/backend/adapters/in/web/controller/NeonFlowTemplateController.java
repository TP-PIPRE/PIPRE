package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.ports.input.GetNeonFlowTemplateUseCase;
import com.pipre.backend.domain.entities.activity.NeonFlowTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/neonflow/templates")
@RequiredArgsConstructor
public class NeonFlowTemplateController {
    private final GetNeonFlowTemplateUseCase useCase;

    @GetMapping("/{templateId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<NeonFlowTemplate> get(@PathVariable String templateId) {
        return ResponseEntity.of(useCase.execute(templateId));
    }
}
