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
import com.pipre.backend.application.dto.PageResponse;
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
    private final com.pipre.backend.infrastructure.security.AcademicAccessPolicy access;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener lista de cursos paginada")
    @ApiResponse(responseCode = "200", description = "Lista paginada obtenida exitosamente")
    public ResponseEntity<PageResponse<CourseDTO>> getCourses(Pageable pageable) {
        var ids=access.visibleCourses();
        return ResponseEntity.ok(PageResponse.from(ids==null?getCoursesUseCase.execute(pageable):getCoursesUseCase.visible(ids,pageable)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Solicitud de creación de curso (catálogo cerrado)")
    @ApiResponse(responseCode = "400", description = "El catálogo solo admite los cursos oficiales")
    public ResponseEntity<Void> postCourse(@RequestBody RegisterCourseCommand requestDTO) {
        createCourseUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{idCourse}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar un curso existente")
    @ApiResponse(responseCode = "204", description = "Curso actualizado exitosamente")
    public ResponseEntity<Void> putCourse(@PathVariable String idCourse,
            @RequestBody RegisterCourseCommand requestDTO) {
        updateCoursesUseCase.execute(idCourse, requestDTO);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/{idCourse}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar un curso existente")
    @ApiResponse(responseCode = "204", description = "Curso eliminado exitosamente")
    @ApiResponse(responseCode = "400", description = "El curso es parte del catálogo oficial")
    public ResponseEntity<Void> deleteCourse(@PathVariable String idCourse) {
        deleteCourseUseCase.execute(idCourse);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
