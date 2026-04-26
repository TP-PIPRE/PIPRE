package com.pipre.backend.adapters.in.controller;

import com.pipre.backend.adapters.in.controller.dto.LessonResponseDTO;
import com.pipre.backend.application.usecases.LessonService;
import com.pipre.backend.adapters.in.controller.dto.LessonRequestDTO;
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

    private final LessonService lessonService;

    @GetMapping("/module/{idModule}")
    public ResponseEntity<List<LessonResponseDTO>> getLessons(@PathVariable UUID idModule) {
        return ResponseEntity.ok().body(lessonService.getLessons(idModule));
    }

    @PostMapping
    public ResponseEntity<Void> postLesson(@RequestBody LessonRequestDTO requestDTO) {
        lessonService.postLesson(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
