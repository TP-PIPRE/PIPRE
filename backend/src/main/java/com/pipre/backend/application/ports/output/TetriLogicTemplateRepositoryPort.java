package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.activity.TetriLogicTemplate;
import java.util.Optional;

public interface TetriLogicTemplateRepositoryPort {
    Optional<TetriLogicTemplate> findById(String templateId);
}
