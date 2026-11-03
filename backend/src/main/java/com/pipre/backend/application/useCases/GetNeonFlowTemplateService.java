package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.input.GetNeonFlowTemplateUseCase;
import com.pipre.backend.application.ports.output.NeonFlowTemplateRepositoryPort;
import com.pipre.backend.domain.entities.activity.NeonFlowTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GetNeonFlowTemplateService implements GetNeonFlowTemplateUseCase {
    private final NeonFlowTemplateRepositoryPort repository;

    @Transactional(readOnly = true)
    public Optional<NeonFlowTemplate> execute(String templateId) {
        return repository.findById(templateId);
    }
}
