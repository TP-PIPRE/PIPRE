package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class Lesson {

    private final String idLesson;
    private final String title;
    private final String content;
    private final String resourceType;
    private final List<String> idActivityList;
    private final String idModule;

}
