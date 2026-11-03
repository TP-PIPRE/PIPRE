package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.activity.NeonFlowTemplate;
import java.util.Optional;

public interface NeonFlowTemplateRepositoryPort {
    Optional<NeonFlowTemplate> findById(String templateId);
}
