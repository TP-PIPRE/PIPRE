package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@Getter
public class Course {

    private final String idCourse;
    private final String name;
    private final String description;
    private final String level;
    private final String objective;
    private final LocalDateTime createdAt;
    private final List<String> idModuleList;

}
