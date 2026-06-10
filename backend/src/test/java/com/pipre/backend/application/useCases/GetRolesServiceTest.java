package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.RoleDTO;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.domain.entities.role.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetRolesServiceTest {

    @Mock private RoleRepositoryPort repositoryPort;
    @InjectMocks private GetRolesService getRolesService;

    @Test
    @DisplayName("Debería retornar todos los roles mapeados a DTO")
    void shouldReturnAllRoles() {
        Role role = Role.builder().idRole("r1").name("ADMIN").build();
        when(repositoryPort.findAll()).thenReturn(List.of(role));

        List<RoleDTO> result = getRolesService.execute();

        assertFalse(result.isEmpty());
        assertEquals("ADMIN", result.getFirst().name());
    }
}
