package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaRepositories.HelpRequestJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.HelpRequestMapper;
import com.pipre.backend.application.ports.output.HelpRequestRepositoryPort;
import com.pipre.backend.domain.entities.HelpRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class HelpRequestRepositoryAdapter implements HelpRequestRepositoryPort {
    private final HelpRequestJpaRepository helpRequestJpaRepository;

    @Override
    public Optional<HelpRequest> findById(String idHelpRequest) {
        return helpRequestJpaRepository.findById(idHelpRequest)
                .map(HelpRequestMapper::toDomain);
    }
}
