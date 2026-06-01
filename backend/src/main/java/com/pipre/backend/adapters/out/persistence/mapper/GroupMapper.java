package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.RankingJpaEntity;
import com.pipre.backend.domain.entities.Group;

import java.util.ArrayList;
import java.util.List;

public class GroupMapper {
    public static GroupJpaEntity toJpaEntity(Group domain) {
        if(domain == null) return null;
        GroupJpaEntity entity = new GroupJpaEntity();
        entity.setIdGroup(domain.getIdGroup());
        entity.setGroupName(domain.getGroupName());
        return entity;
    }

    public static Group toDomain(GroupJpaEntity entity) {
        if (entity == null) return null;
        List<String> idGroupStudentList = (entity.getRankingJpaEntityList() == null)
                ? new ArrayList<>()
                : entity.getRankingJpaEntityList()
                        .stream()
                        .map(RankingJpaEntity::getIdRanking)
                        .toList();
        return Group.builder()
                .idGroup(entity.getIdGroup())
                .groupName(entity.getGroupName())
                .idGroupStudentList(idGroupStudentList)
                .build();
    }
}
