package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ResultJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ResultJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ActivityJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.ResultMapper;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.result.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ResultRepositoryAdapter implements ResultRepositoryPort {
    private final ResultJpaRepository resultJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final ActivityJpaRepository activityJpaRepository;
    private final ResultMapper resultMapper;

    @Override
    public Optional<Result> findById(String idResult) {
        return resultJpaRepository.findById(idResult)
                .map(resultMapper::toDomain);
    }

    @Override
    public List<Result> findByIdStudent(String idStudent) {
        return resultJpaRepository.findByStudentJpaEntityIdUser(idStudent)
                .stream()
                .map(resultMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Result result) {
        ResultJpaEntity entity = resultMapper.toJpaEntity(result);

        if (result.getIdStudent() != null) {
            userJpaRepository.findById(result.getIdStudent())
                    .ifPresent(entity::setStudentJpaEntity);
        }

        if (result.getIdActivity() != null) {
            activityJpaRepository.findById(result.getIdActivity())
                    .ifPresent(entity::setActivityJpaEntity);
        }

        resultJpaRepository.save(entity);
    }
}
