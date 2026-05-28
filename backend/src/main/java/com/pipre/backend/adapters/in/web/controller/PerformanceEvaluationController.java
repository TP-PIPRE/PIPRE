package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.RatingRequestDTO;
import com.pipre.backend.adapters.in.web.dto.RatingResponseDTO;
import com.pipre.backend.application.ports.input.RatingPerformanceUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/performance")
@RequiredArgsConstructor
public class PerformanceEvaluationController {

    private final RatingPerformanceUseCase ratingPerformanceUseCase;

    @PostMapping("/rating")
    public ResponseEntity<RatingResponseDTO> ratingPerformance(@RequestBody RatingRequestDTO requestDTO) {
        return ResponseEntity.ok(ratingPerformanceUseCase.execute(requestDTO));
    }
}
