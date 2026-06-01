package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.ResultRequestDTO;
import com.pipre.backend.adapters.in.web.dto.StudentResultResponseDTO;
import com.pipre.backend.application.ports.input.GetStudentResultUseCase;
import com.pipre.backend.application.ports.input.SaveResultUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activity-results")
@RequiredArgsConstructor
public class ResultController {

    private final GetStudentResultUseCase getStudentResultUseCase;
    private final SaveResultUseCase saveResultUseCase;

    @GetMapping("/user/{idStudent}")
    public ResponseEntity<List<StudentResultResponseDTO>> getStudentResult(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentResultUseCase.execute(idStudent));
    }

    @PostMapping
    public ResponseEntity<Void> saveResult(@RequestBody ResultRequestDTO requestDTO) {
        saveResultUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

}
