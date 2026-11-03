package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.repositories.TetriLogicTemplateJpaRepository;
import com.pipre.backend.application.ports.output.TetriLogicTemplateRepositoryPort;
import com.pipre.backend.domain.entities.activity.TetriLogicTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class TetriLogicTemplateRepositoryAdapter implements TetriLogicTemplateRepositoryPort {
    private final TetriLogicTemplateJpaRepository repository;
    public Optional<TetriLogicTemplate> findById(String templateId) {
        return repository.findById(templateId).map(e -> new TetriLogicTemplate(e.getTemplateId(), e.getVersion(), e.getConfig()));
    }
}
