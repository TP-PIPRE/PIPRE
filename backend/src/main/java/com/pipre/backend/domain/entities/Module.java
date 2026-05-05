package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Builder
@Getter
public class Module {

    private final String idModule;
    private final String title;
    private final String description;
    private final String difficulty;
    private final Integer moduleOrder;
    private final BigDecimal percentageMeta;
    private final List<String> idLessonList;
    private final String idCourse;

}
