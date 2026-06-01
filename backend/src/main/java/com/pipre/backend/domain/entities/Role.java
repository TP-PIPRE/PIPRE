package com.pipre.backend.domain.entities;

public class Role {

    private final String idRole;
    private final String name;
    private final String description;

    Role(String idRole, String name, String description) {
        this.idRole = idRole;
        this.name = name;
        this.description = description;
    }

    public static RoleBuilder builder() {
        return new RoleBuilder();
    }

    public String getIdRole() {
        return this.idRole;
    }

    public String getName() {
        return this.name;
    }

    public String getDescription() {
        return this.description;
    }

    public static class RoleBuilder {
        private String idRole;
        private String name;
        private String description;

        RoleBuilder() {
        }

        public RoleBuilder idRole(String idRole) {
            this.idRole = idRole;
            return this;
        }

        public RoleBuilder name(String name) {
            this.name = name;
            return this;
        }

        public RoleBuilder description(String description) {
            this.description = description;
            return this;
        }

        public Role build() {
            return new Role(this.idRole, this.name, this.description);
        }

        public String toString() {
            return "Role.RoleBuilder(idRole=" + this.idRole + ", name=" + this.name + ", description=" + this.description + ")";
        }
    }
}
