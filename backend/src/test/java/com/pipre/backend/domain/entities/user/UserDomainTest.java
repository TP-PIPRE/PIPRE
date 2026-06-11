package com.pipre.backend.domain.entities.user;

import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserDomainTest {

    @Test
    @DisplayName("Debería crear Email válido correctamente")
    void shouldCreateValidEmail() {
        Email email = new Email("test@domain.com");
        assertEquals("test@domain.com", email.value());
    }

    @Test
    @DisplayName("Debería lanzar excepción para emails inválidos")
    void shouldThrowExceptionForInvalidEmails() {
        assertThrows(BusinessException.class, () -> new Email(null));
        assertThrows(BusinessException.class, () -> new Email(""));
        assertThrows(BusinessException.class, () -> new Email("invalid-email"));
        assertThrows(BusinessException.class, () -> new Email("@domain.com"));
        assertThrows(BusinessException.class, () -> new Email("test@"));
    }

    @Test
    @DisplayName("Debería crear Age válido correctamente")
    void shouldCreateValidAge() {
        Age age = new Age(25);
        assertEquals(25, age.value());

        Age nullAge = new Age(null);
        assertNull(nullAge.value());
    }

    @Test
    @DisplayName("Debería lanzar excepción para edades inválidas")
    void shouldThrowExceptionForInvalidAges() {
        assertThrows(BusinessException.class, () -> new Age(-1));
        assertThrows(BusinessException.class, () -> new Age(121));
    }
}
