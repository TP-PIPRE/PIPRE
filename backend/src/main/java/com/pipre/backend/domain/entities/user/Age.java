package com.pipre.backend.domain.entities.user;

import com.pipre.backend.domain.exceptions.BusinessException;

public record Age(Integer value) {
    public Age {
        if (value != null) {
            if (value < 0) {
                throw new BusinessException("La edad no puede ser negativa.");
            }
            if (value > 120) {
                throw new BusinessException("La edad no es válida.");
            }
        }
    }
}
