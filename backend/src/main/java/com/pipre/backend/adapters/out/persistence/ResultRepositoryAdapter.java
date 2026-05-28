package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaRepositories.ResultJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.ResultMapper;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ResultRepositoryAdapter implements ResultRepositoryPort {


    private final ResultJpaRepository resultJpaRepository;

    @Override
    public Optional<Result> findById(String idResult) {
        return resultJpaRepository.findById(idResult)
                .map(ResultMapper::toDomain);
    }
}
