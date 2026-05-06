package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.ModuleRequestDTO;
import com.pipre.backend.adapters.in.web.dto.ModuleResponseDTO;
import com.pipre.backend.application.ports.input.CreateModuleUseCase;
import com.pipre.backend.application.ports.input.GetModulesUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final GetModulesUseCase getModulesUseCase;
    private final CreateModuleUseCase createModuleUseCase;

    @GetMapping("course/{idCourse}")
    public ResponseEntity<List<ModuleResponseDTO>> getModules(@PathVariable String idCourse) {
        return ResponseEntity.ok(getModulesUseCase.execute(idCourse));
    }

    @PostMapping
    public ResponseEntity<Void> postModule(@RequestBody ModuleRequestDTO requestDTO) {
        createModuleUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
