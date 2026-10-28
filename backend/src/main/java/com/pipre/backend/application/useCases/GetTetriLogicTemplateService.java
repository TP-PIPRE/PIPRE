package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.input.GetTetriLogicTemplateUseCase;
import com.pipre.backend.application.ports.output.TetriLogicTemplateRepositoryPort;
import com.pipre.backend.domain.entities.activity.TetriLogicTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GetTetriLogicTemplateService implements GetTetriLogicTemplateUseCase {
    private final TetriLogicTemplateRepositoryPort repository;

    @Transactional(readOnly = true)
    public Optional<TetriLogicTemplate> execute(String templateId) {
        return repository.findById(templateId);
    }
}
