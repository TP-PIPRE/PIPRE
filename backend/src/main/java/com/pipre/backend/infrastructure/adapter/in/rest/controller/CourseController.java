package com.pipre.backend.infrastructure.adapter.in.rest.controller;

import com.pipre.backend.application.usecase.CourseService;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.CourseRequestPostDTO;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.CourseRequestPutDTO;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.CourseResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<List<CourseResponseDTO>> getCourse() {
        return ResponseEntity.ok().body(courseService.getCourse());
    }
    
    @PostMapping
    public ResponseEntity<Void> postCourse(@RequestBody CourseRequestPostDTO requestDTO) {
        courseService.postCourse(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping
    public ResponseEntity<Void> putCourse(@RequestBody CourseRequestPutDTO requestDTO) {
        courseService.updateCourse(requestDTO);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
