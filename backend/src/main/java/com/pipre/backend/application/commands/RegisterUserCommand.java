package com.pipre.backend.application.commands;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RegisterUserCommand(
        @NotBlank(message = "El nombre no puede estar vacío")
        String firstName,
        @NotBlank(message = "El apellido no puede estar vacío")
        String lastName,
        @NotBlank(message = "El email no puede estar vacío")
        @Email(message = "El formato de email no es válido")
        String email,
        @NotBlank(message = "La contraseña no puede estar vacía")
        String passwordHash,
        String grade,
        @NotNull(message = "La edad no puede ser nula")
        @Min(value = 0, message = "La edad no puede ser menor a 0")
        Integer age,
        @NotEmpty(message = "Debe asignar al menos un rol")
        List<String> roleIdList
) {
}
