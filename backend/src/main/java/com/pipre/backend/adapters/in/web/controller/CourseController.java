package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.CourseRequestDTO;
import com.pipre.backend.adapters.in.web.dto.CourseResponseDTO;
import com.pipre.backend.application.ports.input.CreateCoursesUseCase;
import com.pipre.backend.application.ports.input.GetCoursesUseCase;
import com.pipre.backend.application.ports.input.UpdateCoursesUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {
    private final GetCoursesUseCase getCoursesUseCase;
    private final CreateCoursesUseCase createCoursesUseCase;
    private final UpdateCoursesUseCase updateCoursesUseCase;

    @GetMapping
    public ResponseEntity<List<CourseResponseDTO>> getCourses() {
        return ResponseEntity.ok().body(getCoursesUseCase.execute());
    }

    @PostMapping
    public ResponseEntity<Void> postCourse(@RequestBody CourseRequestDTO requestDTO) {
        createCoursesUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{idCourse}")
    public ResponseEntity<Void> putCourse(@RequestBody  @PathVariable String idCourse, CourseRequestDTO requestDTO) {
        updateCoursesUseCase.execute(idCourse, requestDTO);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
