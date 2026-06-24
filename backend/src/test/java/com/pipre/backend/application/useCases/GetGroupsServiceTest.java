package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.ports.output.GroupRepositoryPort;
import com.pipre.backend.domain.entities.group.Group;
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
class GetGroupsServiceTest {

    @Mock
    private GroupRepositoryPort groupRepositoryPort;

    @InjectMocks
    private GetGroupsService getGroupsService;

    @Test
    @DisplayName("Debería retornar todos los grupos mapeados a DTO")
    void shouldReturnAllGroups() {
        Group group = Group.builder()
                .idGroup("g1")
                .groupName("Grupo Alfa")
                .description("Descripción Alfa")
                .idGroupStudentList(List.of("s1"))
                .build();
        when(groupRepositoryPort.findAll()).thenReturn(List.of(group));

        List<GroupDTO> result = getGroupsService.execute();

        assertFalse(result.isEmpty());
        assertEquals("Grupo Alfa", result.getFirst().groupName());
        assertEquals("g1", result.getFirst().idGroup());
        assertEquals("Descripción Alfa", result.getFirst().description());
    }
}
