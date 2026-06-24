package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.ports.output.GroupRepositoryPort;
import com.pipre.backend.domain.entities.group.Group;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetGroupServiceTest {

    @Mock
    private GroupRepositoryPort groupRepositoryPort;

    @InjectMocks
    private GetGroupService getGroupService;

    @Test
    @DisplayName("Debería obtener un grupo por ID correctamente")
    void shouldGetGroupByIdSuccessfully() {
        // Arrange
        String groupId = "g-123";
        Group group = Group.builder()
                .idGroup(groupId)
                .groupName("Grupo Beta")
                .description("Detalles del grupo Beta")
                .idGroupStudentList(List.of("student-1"))
                .build();

        when(groupRepositoryPort.findById(groupId)).thenReturn(Optional.of(group));

        // Act
        GroupDTO result = getGroupService.execute(groupId);

        // Assert
        assertNotNull(result);
        assertEquals(groupId, result.idGroup());
        assertEquals("Grupo Beta", result.groupName());
        assertEquals("Detalles del grupo Beta", result.description());
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException si el grupo no existe")
    void shouldThrowExceptionWhenGroupNotFound() {
        // Arrange
        String groupId = "g-unknown";
        when(groupRepositoryPort.findById(groupId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> getGroupService.execute(groupId));
    }
}
