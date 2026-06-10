package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.adapters.out.persistence.mapper.LessonMapper;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.LessonJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ModuleJpaRepository;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.lesson.Lesson;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class LessonRepositoryAdapter implements LessonRepositoryPort {

    private final LessonJpaRepository lessonJpaRepository;
    private final ModuleJpaRepository moduleJpaRepository;
    private final LessonMapper lessonMapper;

    @Override
    public List<Lesson> findAll() {
        return lessonJpaRepository.findAll()
                .stream()
                .map(lessonMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Lesson lesson) {
        LessonJpaEntity entity = lessonMapper.toJpaEntity(lesson);
        if (lesson.getIdModule() != null) {
            moduleJpaRepository.findById(lesson.getIdModule())
                    .ifPresent(entity::setModuleJpaEntity);
        }
        lessonJpaRepository.save(entity);
    }

    @Override
    public boolean existsById(String idLesson) {
        return lessonJpaRepository.existsById(idLesson);
    }
}
