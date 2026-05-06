package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.adapters.out.persistence.mapper.LessonMapper;
import com.pipre.backend.adapters.out.persistence.repository.LessonJpaRepository;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.Lesson;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class LessonRepositoryAdapter implements LessonRepositoryPort {

    private final LessonJpaRepository lessonJpaRepository;

    @Override
    public List<Lesson> findAll() {
        return lessonJpaRepository.findAll()
                .stream()
                .map(LessonMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Lesson lesson) {
        LessonJpaEntity entity = LessonMapper.toJpaEntity(lesson);
        lessonJpaRepository.save(entity);
    }
}
