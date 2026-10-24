package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateActivityCommand;
import com.pipre.backend.application.dto.ActivityDtoMapper;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.Mission;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ActivityMetadataContractTest {
    @Test void rejectsTemplateFromAnotherEnvironment() {
        assertThrows(IllegalArgumentException.class, () -> Activity.builder().idActivity("a").idLesson("l").name("Reto")
                .environment("neonflow").levelTemplate("tetrilogic-1").build());
    }
    @Test void rejectsNonPositiveOrder() {
        assertThrows(IllegalArgumentException.class, () -> Activity.builder().idActivity("a").idLesson("l").name("Reto").displayOrder(0).build());
    }
    @Test void createsAndExposesPlayableMetadata() {
        var repository = mock(ActivityRepositoryPort.class);
        var lessons = mock(LessonRepositoryPort.class);
        when(lessons.existsById("l")).thenReturn(true);
        new CreateActivityService(repository, lessons).execute(new CreateActivityCommand("l", "Reto", null, null, 1,
                "robotics", "neonflow", List.of(), null, null, "Guía la luz", 2, "neonflow-2"));
        var captor = ArgumentCaptor.forClass(Activity.class);
        verify(repository).save(captor.capture());
        var dto = ActivityDtoMapper.toDTO(captor.getValue());
        assertEquals("Guía la luz", dto.description()); assertEquals(2, dto.displayOrder()); assertEquals("neonflow-2", dto.levelTemplate());
    }
    @Test void legacyUpdatePreservesMetadataAndOmittedMissions() {
        var repository = mock(ActivityRepositoryPort.class);
        var lessons = mock(LessonRepositoryPort.class);
        var mission = Mission.builder().id("m").title("Meta").objective("Ilumina").maxBlocks(5).build();
        var existing = Activity.builder().idActivity("a").idLesson("l").name("Antes").environment("neonflow")
                .description("Texto").displayOrder(3).levelTemplate("neonflow-1").missions(List.of(mission)).build();
        when(repository.findById("a")).thenReturn(Optional.of(existing));
        new UpdateActivityService(repository, lessons).execute("a", new CreateActivityCommand(null, "Después", null, null, null, null, null, null, null, null));
        var captor = ArgumentCaptor.forClass(Activity.class); verify(repository).save(captor.capture());
        assertEquals("Después", captor.getValue().getName()); assertEquals("Texto", captor.getValue().getDescription());
        assertEquals(3, captor.getValue().getDisplayOrder()); assertEquals(List.of(mission), captor.getValue().getMissions());
    }
}
