package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.ports.output.TetriLogicTemplateRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.TetriLogicTemplate;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TetriLogicCatalogContractTest {
    @Test void acceptsExactlyTheThirtyNewTemplatesAndKeepsLegacyCompatibility() throws Exception {
        var json = new ObjectMapper().readTree(getClass().getResourceAsStream("/catalog/tetrilogic-v2.json"));
        assertEquals(30,json.size());
        Set<String> ids = new HashSet<>();
        for (var config:json) {
            String id = config.get("templateId").asText();
            assertTrue(ids.add(id));
            var activity = Activity.builder().idActivity("a").idLesson("l").name("Reto")
                    .environment("tetrilogic").levelTemplate(id).build();
            assertEquals(id,activity.getLevelTemplate());
            assertEquals(2,config.get("version").asInt());
            assertFalse(config.has("solution")); assertFalse(config.has("placements"));
        }
        for(String id:List.of("tetrilogic-v2-0","tetrilogic-v2-31","tetrilogic-v2-01","tetrilogic-v3-1"))
            assertThrows(IllegalArgumentException.class,()->Activity.builder().idActivity("a").idLesson("l").name("Reto").environment("tetrilogic").levelTemplate(id).build());
        assertDoesNotThrow(()->Activity.builder().idActivity("a").idLesson("l").name("Reto").environment("tetrilogic").levelTemplate("tetrilogic-1").build());
    }
    @Test void readsOnlyThePersistedConfigurationAndPreservesUnknownAsAbsent() {
        var port=mock(TetriLogicTemplateRepositoryPort.class);
        var template=new TetriLogicTemplate("tetrilogic-v2-30",2,Map.of("level",30));
        when(port.findById(template.templateId())).thenReturn(Optional.of(template));
        var service=new GetTetriLogicTemplateService(port);
        assertEquals(Optional.of(template),service.execute(template.templateId()));
        assertTrue(service.execute("unknown").isEmpty());
    }
}
