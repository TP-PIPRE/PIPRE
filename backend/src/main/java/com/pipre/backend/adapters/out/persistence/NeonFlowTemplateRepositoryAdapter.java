package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.repositories.NeonFlowTemplateJpaRepository;
import com.pipre.backend.application.ports.output.NeonFlowTemplateRepositoryPort;
import com.pipre.backend.domain.entities.activity.NeonFlowTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class NeonFlowTemplateRepositoryAdapter implements NeonFlowTemplateRepositoryPort {
    private final NeonFlowTemplateJpaRepository repository;
    public Optional<NeonFlowTemplate> findById(String templateId) {
        return repository.findById(templateId).map(e -> new NeonFlowTemplate(e.getTemplateId(), e.getVersion(), e.getConfig()));
    }
}
