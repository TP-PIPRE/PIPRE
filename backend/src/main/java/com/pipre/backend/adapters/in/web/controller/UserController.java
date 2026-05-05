package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.UserResponseDTO;
import com.pipre.backend.application.ports.input.GetUserByIdUseCase;
import com.pipre.backend.application.ports.input.RegisterUserUseCase;
import com.pipre.backend.application.usecases.commands.RegisterUserCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final RegisterUserUseCase registerUserUseCase;
    private final GetUserByIdUseCase getUserByIdUseCase;

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable String userId) {
        UserResponseDTO response = getUserByIdUseCase.execute(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<String> registerUser(@RequestBody RegisterUserCommand command) {
        String newUserId = registerUserUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUserId);
    }
}