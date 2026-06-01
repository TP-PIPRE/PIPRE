package com.pipre.backend.domain.entities;

import java.util.List;

public class Group {

    private final String idGroup;
    private final String groupName;
    private final List<String> idGroupStudentList;

    Group(String idGroup, String groupName, List<String> idGroupStudentList) {
        this.idGroup = idGroup;
        this.groupName = groupName;
        this.idGroupStudentList = idGroupStudentList;
    }

    public static GroupBuilder builder() {
        return new GroupBuilder();
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

    public static class GroupBuilder {
        private String idGroup;
        private String groupName;
        private List<String> idGroupStudentList;

        GroupBuilder() {
        }

        public GroupBuilder idGroup(String idGroup) {
            this.idGroup = idGroup;
            return this;
        }

        public GroupBuilder groupName(String groupName) {
            this.groupName = groupName;
            return this;
        }

        public GroupBuilder idGroupStudentList(List<String> idGroupStudentList) {
            this.idGroupStudentList = idGroupStudentList;
            return this;
        }

        public Group build() {
            return new Group(this.idGroup, this.groupName, this.idGroupStudentList);
        }

        public String toString() {
            return "Group.GroupBuilder(idGroup=" + this.idGroup + ", groupName=" + this.groupName + ", idGroupStudentList=" + this.idGroupStudentList + ")";
        }
    }
}
