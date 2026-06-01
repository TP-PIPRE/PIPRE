package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ResultJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ResultJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.ResultMapper;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
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

    @Override
    public List<Result> findByIdStudent(String idStudent) {
        return resultJpaRepository.findByStudentJpaEntityIdUser(idStudent)
                .stream()
                .map(ResultMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Result result) {
        ResultJpaEntity entity = ResultMapper.toEntity(result);
        resultJpaRepository.save(entity);
    }
}
