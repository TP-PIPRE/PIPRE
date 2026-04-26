package com.pipre.backend.adapters.in.controller;

import com.pipre.backend.adapters.in.controller.dto.ModuleRequestDTO;
import com.pipre.backend.adapters.in.controller.dto.ModuleResponseDTO;
import com.pipre.backend.application.usecases.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
public class ModuleController {
    private final ModuleService moduleService;

    @GetMapping("course/{id}")
    public ResponseEntity<List<ModuleResponseDTO>> getModule(@PathVariable UUID id) {
        return ResponseEntity.ok().body(moduleService.getModule(id));
    }

    @PostMapping
    public ResponseEntity<Void> postModule(@RequestBody ModuleRequestDTO requestDTO) {
        moduleService.postModule(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
