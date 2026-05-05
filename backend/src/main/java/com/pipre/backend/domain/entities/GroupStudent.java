package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class GroupStudent {

    private final String idRanking;
    private final Integer totalPoints;
    private final Integer position;
    private final String idGroup;
    private final String idStudent;

}
