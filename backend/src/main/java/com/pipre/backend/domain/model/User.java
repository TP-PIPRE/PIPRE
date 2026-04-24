package com.pipre.backend.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_user", updatable = false, nullable = false)
    private UUID idUser;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "age")
    private Integer age;

    @Column(name = "grade")
    private String grade;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "institution")
    private String institution;

    @Column(name = "zone")
    private String zone;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_role",
            joinColumns = @JoinColumn(name = "id_user"),
            inverseJoinColumns = @JoinColumn(name = "id_role")
    )
    private List<Role> roles = new ArrayList<>();
}
