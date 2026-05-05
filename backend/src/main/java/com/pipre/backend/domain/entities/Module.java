package com.pipre.backend.domain.entities;

import java.math.BigDecimal;
import java.util.List;

public class Module {

    private String idModule;
    private String title;
    private String description;
    private String difficulty;
    private Integer moduleOrder;
    private BigDecimal percentageMeta;
    private List<String> idLessonList;
    private String idCourse;

}
