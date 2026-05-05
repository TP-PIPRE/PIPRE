package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.usecases.CourseService;
import com.pipre.backend.adapters.in.web.dto.CourseRequestDTO;
import com.pipre.backend.adapters.in.web.dto.CourseResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {
//    private final CourseService courseService;
//
//    @GetMapping
//    public ResponseEntity<List<CourseResponseDTO>> getCourses() {
//        return ResponseEntity.ok().body(courseService.getCourse());
//    }
//
//    @PostMapping
//    public ResponseEntity<Void> postCourse(@RequestBody CourseRequestDTO requestDTO) {
//        courseService.postCourse(requestDTO);
//        return ResponseEntity.status(HttpStatus.CREATED).build();
//    }
//
//    @PutMapping("/{id}")
//    public ResponseEntity<Void> putCourse(@RequestBody  @PathVariable UUID id, CourseRequestDTO requestDTO) {
//        courseService.updateCourse(id, requestDTO);
//        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
//    }
}
