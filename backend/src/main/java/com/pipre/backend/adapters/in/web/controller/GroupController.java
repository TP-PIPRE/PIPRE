package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.GroupResponseDTO;
import com.pipre.backend.application.ports.input.GetGroupsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GetGroupsUseCase getGroupsUseCase;

    @GetMapping
    public ResponseEntity<List<GroupResponseDTO>> getGroups() {
        return ResponseEntity.ok(getGroupsUseCase.execute());
    }
}
