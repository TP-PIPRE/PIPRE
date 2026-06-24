package com.pipre.backend.domain.entities.group;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.util.List;

public class Group {

    private final String idGroup;
    private final String groupName;
    private final String description;
    private final List<String> idGroupStudentList;

    Group(String idGroup, String groupName, String description, List<String> idGroupStudentList) {
        if (idGroup == null || idGroup.isBlank()) {
            throw new BusinessException("El ID del grupo es obligatorio.");
        }
        if (groupName == null || groupName.isBlank()) {
            throw new BusinessException("El nombre del grupo es obligatorio.");
        }
        this.idGroup = idGroup;
        this.groupName = groupName;
        this.description = description;
        this.idGroupStudentList = idGroupStudentList != null ? List.copyOf(idGroupStudentList) : List.of();
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

    public String getDescription() {
        return this.description;
    }

    public List<String> getIdGroupStudentList() {
        return this.idGroupStudentList;
    }

    public static class GroupBuilder {
        private String idGroup;
        private String groupName;
        private String description;
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

        public GroupBuilder description(String description) {
            this.description = description;
            return this;
        }

        public GroupBuilder idGroupStudentList(List<String> idGroupStudentList) {
            this.idGroupStudentList = idGroupStudentList;
            return this;
        }

        public Group build() {
            return new Group(this.idGroup, this.groupName, this.description, this.idGroupStudentList);
        }

        public String toString() {
            return "Group.GroupBuilder(idGroup=" + this.idGroup + ", groupName=" + this.groupName + ", description=" + this.description + ", idGroupStudentList=" + this.idGroupStudentList + ")";
        }
    }
}
