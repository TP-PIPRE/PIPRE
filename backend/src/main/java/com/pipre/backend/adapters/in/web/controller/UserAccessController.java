package com.pipre.backend.adapters.in.web.controller;
import com.pipre.backend.application.useCases.SetUserActiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
@RestController @RequestMapping("/api/v1/users") @RequiredArgsConstructor
public class UserAccessController {
    private final SetUserActiveService service;
    public record Status(@jakarta.validation.constraints.NotNull Boolean active) {}
    @PutMapping("/{id}/status") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> status(@PathVariable String id,@jakarta.validation.Valid @RequestBody Status status){service.execute(id,status.active());return ResponseEntity.noContent().build();}
}
