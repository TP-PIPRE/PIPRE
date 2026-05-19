package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.domain.entities.Lesson;

import java.util.ArrayList;
import java.util.List;

public class LessonMapper {
    public static LessonJpaEntity toJpaEntity(Lesson domain) {
        if(domain == null) return null;
        LessonJpaEntity entity = new LessonJpaEntity();
        entity.setIdLesson(domain.getIdLesson());
        entity.setTitle(domain.getTitle());
        return entity;
    }

    public static Lesson toDomain(LessonJpaEntity entity) {
        if (entity == null) return null;
        String idModule = (entity.getModuleJpaEntity() == null)
                ? null
                : entity.getModuleJpaEntity().getIdModule();
        List<String> idActivityList = (entity.getActivityJpaEntityList() == null)
                ? new ArrayList<>()
                : entity.getActivityJpaEntityList()
                        .stream()
                        .map(ActivityJpaEntity::getIdActivity)
                        .toList();
        return new Lesson.Builder()
                .idLesson(entity.getIdLesson())
                .title(entity.getTitle())
                .idModule(idModule)
                .idActivityList(idActivityList)
                .build();
    }
}
