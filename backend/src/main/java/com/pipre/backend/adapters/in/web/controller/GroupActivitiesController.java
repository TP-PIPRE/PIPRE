package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.useCases.AcademicAdministrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Pageable;

@RestController @RequestMapping("/api/v1/groups/{group}/activities") @RequiredArgsConstructor
public class GroupActivitiesController {
    private final AcademicAdministrationService service;
    @GetMapping @PreAuthorize("@academicAccess.readGroup(#group)")
    public PageResponse<ActivityDTO> list(@PathVariable String group,Pageable pageable){return service.groupActivities(group,pageable);}
    @PutMapping("/{activity}") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assign(@PathVariable String group,@PathVariable String activity){service.groupActivity(group,activity,true);return ResponseEntity.noContent().build();}
    @DeleteMapping("/{activity}") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remove(@PathVariable String group,@PathVariable String activity){service.groupActivity(group,activity,false);return ResponseEntity.noContent().build();}
}
