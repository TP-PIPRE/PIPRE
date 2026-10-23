package com.pipre.backend.adapters.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** Public registration does not require the client to know internal role IDs. */
public record RegisterUserRequestDTO(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank String passwordHash,
        String grade,
        @NotNull @Min(0) Integer age,
        List<String> roleIdList) {
}
