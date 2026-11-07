package com.pipre.backend.adapters.in.web.controller;
import com.fasterxml.jackson.databind.JsonNode;
import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.useCases.PatchCurriculumService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController @RequestMapping("/api/v1") @RequiredArgsConstructor
public class PatchCurriculumController {
    private final PatchCurriculumService service;
    private final com.pipre.backend.infrastructure.security.AcademicAccessPolicy access;
    @PatchMapping("/courses/{id}") @PreAuthorize("hasRole('ADMIN')")
    public CourseDTO course(@PathVariable String id,@RequestBody JsonNode patch){return service.course(id,patch);}
    @PatchMapping("/activities/{id}") @PreAuthorize("@academicAccess.manageActivity(#id)")
    public ActivityDTO activity(@PathVariable String id,@RequestBody JsonNode patch){
        if(patch.has("idLesson")&&!access.manageLesson(patch.get("idLesson").asText()))throw new org.springframework.security.access.AccessDeniedException("La lección no está asignada.");
        return service.activity(id,patch);
    }
}
