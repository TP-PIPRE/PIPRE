package com.pipre.backend.domain.entities.user;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.util.regex.Pattern;

public record Email(String value) {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    public Email {
        if (value == null || value.isBlank()) {
            throw new BusinessException("El email del usuario es obligatorio.");
        }
        if (!EMAIL_PATTERN.matcher(value).matches()) {
            throw new BusinessException("Formato de email inválido.");
        }
    }
}
