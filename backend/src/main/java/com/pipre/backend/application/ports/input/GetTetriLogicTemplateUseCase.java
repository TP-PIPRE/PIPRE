package com.pipre.backend.application.ports.input;

import com.pipre.backend.domain.entities.activity.TetriLogicTemplate;
import java.util.Optional;

public interface GetTetriLogicTemplateUseCase {
    Optional<TetriLogicTemplate> execute(String templateId);
}
