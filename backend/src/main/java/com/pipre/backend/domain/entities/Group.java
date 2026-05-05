package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class Group {

    private final String idGroup;
    private final String idTeacher;
    private final String groupName;
    private final String grade;
    private final String section;
    private final List<String> idGroupStudentList;

}
