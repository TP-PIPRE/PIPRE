package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.UserDTO;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetUserByIdServiceTest {

    @Mock private UserRepositoryPort userRepositoryPort;
    @InjectMocks private GetUserByIdService getUserByIdService;

    @Test
    @DisplayName("Debería retornar el DTO del usuario si existe")
    void shouldReturnUserResponseWhenFound() {
        User user = new User.Builder().idUser("u1").firstName("Ada").lastName("Lovelace").email("ada@p.com").build();
        when(userRepositoryPort.findById("u1")).thenReturn(Optional.of(user));

        UserDTO result = getUserByIdService.execute("u1");

        assertEquals("Ada", result.firstName());
        assertEquals("ada@p.com", result.email());
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException si el usuario no es encontrado")
    void shouldThrowExceptionWhenUserNotFound() {
        when(userRepositoryPort.findById("any")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> getUserByIdService.execute("any"));
    }
}
