package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.RoleResponseDTO;
import com.pipre.backend.adapters.in.web.dto.RoleUserRequestDTO;
import com.pipre.backend.application.usecases.AssignRoleService;
import com.pipre.backend.application.usecases.GetRolesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final AssignRoleService assignRoleService;
    private final GetRolesService getRolesService;

    @GetMapping
    public ResponseEntity<List<RoleResponseDTO>> getRoles() {
        return ResponseEntity.ok(getRolesService.execute());
    }

    @PostMapping("/user")
    public ResponseEntity<Void> assignRole(@RequestBody RoleUserRequestDTO requestDTO) {
        assignRoleService.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}