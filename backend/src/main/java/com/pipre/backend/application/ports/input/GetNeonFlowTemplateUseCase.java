package com.pipre.backend.application.ports.input;

import com.pipre.backend.domain.entities.activity.NeonFlowTemplate;
import java.util.Optional;

public interface GetNeonFlowTemplateUseCase {
    Optional<NeonFlowTemplate> execute(String templateId);
}
