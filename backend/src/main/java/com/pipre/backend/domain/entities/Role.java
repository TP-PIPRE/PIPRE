package com.pipre.backend.domain.entities;

public class Role {

    private final String idRole;
    private final String name;
    private final String description;

    public Role(Builder builder) {
        this.idRole = builder.idRole;
        this.name = builder.name;
        this.description = builder.description;
    }

    public static class Builder {
        private String idRole;
        private String name;
        private String description;

        public Builder idRole(String idRole) {this.idRole = idRole; return this; }
        public Builder name(String name) {this.name = name; return this; }
        public Builder description(String description) {this.description = description; return this; }
        public Role build() {
            return new Role(this);
        }
    }

    public String getIdRole() {
        return idRole;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
