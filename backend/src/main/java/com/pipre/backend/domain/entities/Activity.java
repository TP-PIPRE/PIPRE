package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class Activity {

    private final String idActivity;
    private final String name;
    private final String complexity;
    private final String difficulty;
    private final Integer logicLevel;
    private final String type;
    private final List<String> idimulationList;
    private final String idLesson;

}
