package com.pipre.backend.domain.entities;

import java.util.List;

public class Group {

    private final String idGroup;
    private final String groupName;
    private final List<String> idGroupStudentList;

    public Group(Builder builder) {
        this.idGroup = builder.idGroup;
        this.groupName = builder.groupName;
        this.idGroupStudentList = builder.idGroupStudentList;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getIdGroup() {
        return this.idGroup;
    }

    public String getGroupName() {
        return this.groupName;
    }

    public List<String> getIdGroupStudentList() {
        return this.idGroupStudentList;
    }

    public static class Builder {
        private String idGroup;
        private String groupName;
        private List<String> idGroupStudentList;

        public Builder() {
        }

        public Builder idGroup(String idGroup) {
            this.idGroup = idGroup;
            return this;
        }

        public Builder groupName(String groupName) {
            this.groupName = groupName;
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
