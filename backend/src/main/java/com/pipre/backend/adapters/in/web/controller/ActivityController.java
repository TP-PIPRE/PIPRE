package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.ActivityRequestDTO;
import com.pipre.backend.adapters.in.web.dto.ActivityResponseDTO;
import com.pipre.backend.application.usecases.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/lesson/{id}")
    public ResponseEntity<List<ActivityResponseDTO>> getActivities(@PathVariable UUID id) {
        return ResponseEntity.ok().body(activityService.getActivities(id));
    }

    @PostMapping
    public ResponseEntity<Void> postActivity(@RequestBody ActivityRequestDTO requestDTO) {
        activityService.postActivity(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

}
