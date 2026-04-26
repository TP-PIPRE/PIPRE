package com.pipre.backend.adapters.in.controller;

import com.pipre.backend.adapters.in.controller.dto.RoleResponseDTO;
import com.pipre.backend.adapters.in.controller.dto.RoleUserRequestDTO;
import com.pipre.backend.application.usecases.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<List<RoleResponseDTO>> getAllRoles() {
        return ResponseEntity.ok(roleService.getRoles());
    }

    @PostMapping("/user")
    public ResponseEntity<Void> assignRoleToUser(@RequestBody RoleUserRequestDTO requestDTO) {
        roleService.getRoleUser(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}