package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.HelpRequestJpaEntity;
import com.pipre.backend.domain.entities.HelpRequest;

public class HelpRequestMapper {
        public static HelpRequest toDomain(HelpRequestJpaEntity entity) {
        if (entity == null) return null;

        String idStudent = (entity.getStudentJpaEntity() == null)
                ? null
                : entity.getStudentJpaEntity().getIdUser();

        return HelpRequest.builder()
                .idHelpRequest(entity.getIdHelpRequest())
                .aiInteractions(entity.getAiInteractions())
                .requestedAt(entity.getRequestedAt())
                .idStudent(idStudent)
                .build();
    }
}
