package com.pipre.backend.adapters.in.web.dto;

public record LoginRequest(
        String email,
        String password) {
}
