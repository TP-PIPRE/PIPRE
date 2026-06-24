package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ActivityJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.LessonJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.ActivityMapper;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Component
@RequiredArgsConstructor
public class ActivityRepositoryAdapter implements ActivityRepositoryPort {

    private final ActivityJpaRepository activityJpaRepository;
    private final LessonJpaRepository lessonJpaRepository;
    private final ActivityMapper activityMapper;

    @Override
    public List<Activity> findAll() {
        return activityJpaRepository.findAll()
                .stream()
                .map(activityMapper::toDomain)
                .toList();
    }

    @Override
    public List<Activity> findByLessonId(String idLesson) {
        return activityJpaRepository.findByLessonJpaEntity_IdLesson(idLesson)
                .stream()
                .map(activityMapper::toDomain)
                .toList();
    }

    @Override
    public Page<Activity> findByLessonId(String idLesson, Pageable pageable) {
        return activityJpaRepository.findByLessonJpaEntity_IdLesson(idLesson, pageable)
                .map(activityMapper::toDomain);
    }

    @Override
    public void save(Activity activity) {
        ActivityJpaEntity entity = activityMapper.toJpaEntity(activity);
        if (activity.getIdLesson() != null) {
            lessonJpaRepository.findById(activity.getIdLesson())
                    .ifPresent(entity::setLessonJpaEntity);
        }
        activityJpaRepository.save(entity);
    }

    @Override
    public Optional<Activity> findById(String idActivity) {
        return activityJpaRepository.findById(idActivity)
                .map(activityMapper::toDomain);
    }

    @Override
    public void deleteById(String idActivity) {
        activityJpaRepository.deleteById(idActivity);
    }
}
