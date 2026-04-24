package com.pipre.backend.infrastructure.adapter.in.rest.controller;

import com.pipre.backend.application.usecase.LessonService;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.LessonsRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lesson")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("")
    public ResponseEntity<List<LessonsRequestDTO>> getLessons() {
        return ResponseEntity.ok().body(lessonService.getLessons());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> postLesson(@RequestBody  @PathVariable UUID id, LessonsRequestDTO requestDTO) {
        lessonService.updateLesson(id, requestDTO);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
