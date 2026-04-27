package com.pipre.backend.adapters.in.controller.dto;

public record LoginRequest(
        String email,
        String password) {
}
