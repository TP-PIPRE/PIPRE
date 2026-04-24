package com.pipre.backend.infrastructure.adapter.in.rest.controller;

import com.pipre.backend.application.usecase.CourseService;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.CourseRequestDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    public ResponseEntity<Void> postCourse(@RequestBody CourseRequestDTO requestDTO) {
        courseService.postCourse(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
