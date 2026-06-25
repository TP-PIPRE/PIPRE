package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.commands.RegisterCourseCommand;
import com.pipre.backend.application.dto.CourseDTO;
import com.pipre.backend.application.ports.input.CreateCourseUseCase;
import com.pipre.backend.application.ports.input.GetCoursesUseCase;
import com.pipre.backend.application.ports.input.UpdateCoursesUseCase;
import com.pipre.backend.application.ports.input.DeleteCourseUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
@Tag(name = "Cursos")
public class CourseController {
    private final GetCoursesUseCase getCoursesUseCase;
    private final CreateCourseUseCase createCourseUseCase;
    private final UpdateCoursesUseCase updateCoursesUseCase;
    private final DeleteCourseUseCase deleteCourseUseCase;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener lista de cursos paginada")
    @ApiResponse(responseCode = "200", description = "Lista paginada obtenida exitosamente")
    public ResponseEntity<Page<CourseDTO>> getCourses(Pageable pageable) {
        return ResponseEntity.status(HttpStatus.OK).body(getCoursesUseCase.execute(pageable));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Crear un nuevo curso")
    @ApiResponse(responseCode = "201", description = "Curso creado exitosamente")
    public ResponseEntity<Void> postCourse(@RequestBody RegisterCourseCommand requestDTO) {
        createCourseUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{idCourse}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Actualizar un curso existente")
    @ApiResponse(responseCode = "204", description = "Curso actualizado exitosamente")
    public ResponseEntity<Void> putCourse(@PathVariable String idCourse,
            @RequestBody RegisterCourseCommand requestDTO) {
        updateCoursesUseCase.execute(idCourse, requestDTO);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/{idCourse}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Eliminar un curso existente")
    @ApiResponse(responseCode = "204", description = "Curso eliminado exitosamente")
    public ResponseEntity<Void> deleteCourse(@PathVariable String idCourse) {
        deleteCourseUseCase.execute(idCourse);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
