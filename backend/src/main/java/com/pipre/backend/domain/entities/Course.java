package com.pipre.backend.domain.entities;

import java.time.LocalDateTime;
import java.util.List;

public class Course {
    private String idCourse;
    private String name;
    private String description;
    private String level;
    private String objective;
    private LocalDateTime createdAt;
    private List<String> idModuleList;
}
