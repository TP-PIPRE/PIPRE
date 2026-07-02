package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.LoginResponseDTO;
import com.pipre.backend.adapters.in.web.dto.MessageResponseDTO;
import com.pipre.backend.adapters.in.web.dto.LoginRequestDTO;
import com.pipre.backend.infrastructure.security.JwtUtils;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.domain.entities.role.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación")
public class AuthController {
        private final AuthenticationManager authenticationManager;
        private final JwtUtils jwtUtils;
        private final UserRepositoryPort userRepositoryPort;
        private final RoleRepositoryPort roleRepositoryPort;

        @PostMapping("/login")
        @Operation(summary = "Inicio de sesión")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Sesión iniciada correctamente"),
                        @ApiResponse(responseCode = "401", description = "Credenciales incorrectas")
        })
        public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequestDTO) {

                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(loginRequestDTO.email(),
                                                loginRequestDTO.password()));

                List<String> roles = authentication.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .toList();

                String token = jwtUtils.createToken(authentication.getName(), roles);

                ResponseCookie cookie = ResponseCookie.from("jwt", token)
                                .httpOnly(true)
                                .secure(true)
                                .path("/")
                                .maxAge(3600)
                                .sameSite("none")
                                .build();

                com.pipre.backend.domain.entities.user.User user = userRepositoryPort
                                .findByEmail(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                Map<String, String> roleMap = roleRepositoryPort.findAll().stream()
                                .collect(Collectors.toMap(Role::getIdRole, Role::getName));

                List<String> roleNames = user.getIdRoleList().stream()
                                .map(roleId -> {
                                        String rName = roleMap.getOrDefault(roleId, "STUDENT").toLowerCase();
                                        if ("teacher".equals(rName)) {
                                                return "docente";
                                        }
                                        return rName;
                                })
                                .toList();

                LoginResponseDTO.UserResponseDTO userResponse = new LoginResponseDTO.UserResponseDTO(
                                user.getIdUser(),
                                user.getEmail(),
                                user.getFirstName(),
                                user.getLastName(),
                                roleNames.isEmpty() ? "student" : roleNames.get(0));

                LoginResponseDTO responseBody = new LoginResponseDTO("Sesión iniciada correctamente", userResponse);

                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                                .body(responseBody);
        }

        @PostMapping("/logout")
        @Operation(summary = "Cierre de sesión")
        @ApiResponse(responseCode = "200", description = "Sesión cerrada correctamente")
        public ResponseEntity<MessageResponseDTO> logout() {
                ResponseCookie cookie = ResponseCookie.from("jwt", "")
                                .httpOnly(true)
                                .secure(true)
                                .path("/")
                                .maxAge(0)
                                .sameSite("Strict")
                                .build();

                MessageResponseDTO response = new MessageResponseDTO("Sesión cerrada correctamente");

                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                                .body(response);
        }
}