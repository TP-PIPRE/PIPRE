package com.pipre.backend.domain.entities;

import java.util.List;

public class Group {

    private final String idGroup;
    private final String idTeacher;
    private final String groupName;
    private final String grade;
    private final String section;
    private final List<String> idGroupStudentList;

    public Group(Builder builder) {
        this.idGroup = builder.idGroup;
        this.idTeacher = builder.idTeacher;
        this.groupName = builder.groupName;
        this.grade = builder.grade;
        this.section = builder.section;
        this.idGroupStudentList = builder.idGroupStudentList;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getIdGroup() {
        return this.idGroup;
    }

    public String getIdTeacher() {
        return this.idTeacher;
    }

    public String getGroupName() {
        return this.groupName;
    }

    public String getGrade() {
        return this.grade;
    }

    public String getSection() {
        return this.section;
    }

    public List<String> getIdGroupStudentList() {
        return this.idGroupStudentList;
    }

    public static class Builder {
        private String idGroup;
        private String idTeacher;
        private String groupName;
        private String grade;
        private String section;
        private List<String> idGroupStudentList;

        public Builder() {
        }

        public Builder idGroup(String idGroup) {
            this.idGroup = idGroup;
            return this;
        }

        public Builder idTeacher(String idTeacher) {
            this.idTeacher = idTeacher;
            return this;
        }

        public Builder groupName(String groupName) {
            this.groupName = groupName;
            return this;
        }

        public Builder grade(String grade) {
            this.grade = grade;
            return this;
        }

        public Builder section(String section) {
            this.section = section;
            return this;
        }

        public Builder idGroupStudentList(List<String> idGroupStudentList) {
            this.idGroupStudentList = idGroupStudentList;
            return this;
        }

        public Group build() {
            return new Group(this);
        }
    }
}
