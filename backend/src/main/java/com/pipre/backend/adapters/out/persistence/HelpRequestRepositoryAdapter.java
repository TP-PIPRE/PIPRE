package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.HelpRequestJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.HelpRequestJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.HelpRequestMapper;
import com.pipre.backend.application.ports.output.HelpRequestRepositoryPort;
import com.pipre.backend.domain.entities.helprequest.HelpRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class HelpRequestRepositoryAdapter implements HelpRequestRepositoryPort {
    private final HelpRequestJpaRepository helpRequestJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final HelpRequestMapper helpRequestMapper;

    @Override
    public Optional<HelpRequest> findById(String idHelpRequest) {
        return helpRequestJpaRepository.findById(idHelpRequest)
                .map(helpRequestMapper::toDomain);
    }

    @Override
    public List<HelpRequest> findAllByIdStudent(String idStudent) {
        return helpRequestJpaRepository.findAllByStudentJpaEntityIdUser(idStudent)
                .stream()
                .map(helpRequestMapper::toDomain)
                .toList();
    }

    @Override
    public void save(HelpRequest helpRequest) {
        HelpRequestJpaEntity entity = helpRequestMapper.toJpaEntity(helpRequest);
        
        if (helpRequest.getIdStudent() != null) {
            userJpaRepository.findById(helpRequest.getIdStudent())
                    .ifPresent(entity::setStudentJpaEntity);
        }
        
        helpRequestJpaRepository.save(entity);
    }
}
