package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.useCases.AcademicAdministrationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/administration")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AcademicAdministrationController {
    private final AcademicAdministrationService administration;
    public record ClassroomRequest(@NotBlank @Size(max=150) String name,@Size(max=2000) String description) {}
    @GetMapping public AcademicAdministrationService.Snapshot snapshot() {return administration.snapshot();}
    @PostMapping("/classrooms") public ResponseEntity<GroupDTO> create(@Valid @RequestBody ClassroomRequest request) {
        return ResponseEntity.status(201).body(administration.createGroup(request.name(),request.description()));
    }
    @PutMapping("/teachers/{teacherId}/classrooms/{groupId}") public ResponseEntity<Void> teacherGroup(@PathVariable String teacherId,@PathVariable String groupId) {administration.teacherGroup(teacherId,groupId,true);return ResponseEntity.noContent().build();}
    @DeleteMapping("/teachers/{teacherId}/classrooms/{groupId}") public ResponseEntity<Void> removeTeacherGroup(@PathVariable String teacherId,@PathVariable String groupId) {administration.teacherGroup(teacherId,groupId,false);return ResponseEntity.noContent().build();}
    @PutMapping("/teachers/{teacherId}/courses/{courseId}") public ResponseEntity<Void> teacherCourse(@PathVariable String teacherId,@PathVariable String courseId) {administration.teacherCourse(teacherId,courseId,true);return ResponseEntity.noContent().build();}
    @DeleteMapping("/teachers/{teacherId}/courses/{courseId}") public ResponseEntity<Void> removeTeacherCourse(@PathVariable String teacherId,@PathVariable String courseId) {administration.teacherCourse(teacherId,courseId,false);return ResponseEntity.noContent().build();}
    @PutMapping("/classrooms/{groupId}/courses/{courseId}") public ResponseEntity<Void> groupCourse(@PathVariable String groupId,@PathVariable String courseId) {administration.groupCourse(groupId,courseId,true);return ResponseEntity.noContent().build();}
    @DeleteMapping("/classrooms/{groupId}/courses/{courseId}") public ResponseEntity<Void> removeGroupCourse(@PathVariable String groupId,@PathVariable String courseId) {administration.groupCourse(groupId,courseId,false);return ResponseEntity.noContent().build();}
}
