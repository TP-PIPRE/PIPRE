package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupStudentJpaEntity;
import com.pipre.backend.domain.entities.Group;

import java.util.ArrayList;
import java.util.List;

public class GroupMapper {
    public static GroupJpaEntity toJpaEntity(Group domain) {
        if(domain == null) return null;
        GroupJpaEntity entity = new GroupJpaEntity();
        entity.setIdGroup(domain.getIdGroup());
        entity.setGroupName(domain.getGroupName());
        entity.setGrade(domain.getGrade());
        entity.setSection(domain.getSection());
        return entity;
    }

    public static Group toDomain(GroupJpaEntity entity) {
        if (entity == null) return null;
        String idTeacher = (entity.getTeacherJpaEntity() == null)
                ? null
                : entity.getTeacherJpaEntity().getIdUser();
        List<String> idGroupStudentList = (entity.getGroupStudentJpaEntityList() == null)
                ? new ArrayList<>()
                : entity.getGroupStudentJpaEntityList()
                        .stream()
                        .map(GroupStudentJpaEntity::getIdRanking)
                        .toList();
        return new Group.Builder()
                .idGroup(entity.getIdGroup())
                .groupName(entity.getGroupName())
                .grade(entity.getGrade())
                .section(entity.getSection())
                .idTeacher(idTeacher)
                .idGroupStudentList(idGroupStudentList)
                .build();
    }
}
