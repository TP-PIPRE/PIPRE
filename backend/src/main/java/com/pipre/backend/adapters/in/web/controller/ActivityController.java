package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.CreateActivityCommand;
import com.pipre.backend.adapters.in.web.dto.ActivityResponseDTO;
import com.pipre.backend.application.ports.input.CreateActivityUseCase;
import com.pipre.backend.application.ports.input.GetActivitiesUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final GetActivitiesUseCase getActivitiesUseCase;
    private final CreateActivityUseCase createActivityUseCase;

    @GetMapping("/lesson/{idLesson}")
    public ResponseEntity<List<ActivityResponseDTO>> getActivities(@PathVariable String idLesson) {
        return ResponseEntity.ok(getActivitiesUseCase.execute(idLesson));
    }

    @PostMapping
    public ResponseEntity<Void> postActivity(@RequestBody CreateActivityCommand requestDTO) {
        createActivityUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

}
