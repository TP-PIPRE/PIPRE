package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.LessonResponseDTO;
import com.pipre.backend.application.ports.input.CreateLessonsUseCase;
import com.pipre.backend.application.ports.input.GetLessonsUseCase;
import com.pipre.backend.application.usecases.LessonService;
import com.pipre.backend.adapters.in.web.dto.LessonRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final GetLessonsUseCase getLessonsUseCase;
    private final CreateLessonsUseCase createLessonsUseCase;

    @GetMapping("/module/{idModule}")
    public ResponseEntity<List<LessonResponseDTO>> getLessons(@PathVariable String idModule) {
        return ResponseEntity.ok(getLessonsUseCase.execute(idModule));
    }

    @PostMapping
    public ResponseEntity<Void> postLesson(@RequestBody LessonRequestDTO requestDTO) {
        createLessonsUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
