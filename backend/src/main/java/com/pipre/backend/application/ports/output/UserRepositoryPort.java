package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.User;

import java.util.List;
import java.util.Optional;

public interface UserRepositoryPort {
    void save(User user);
    boolean existsByEmail(String email);
    Optional<User> findById(String id);
    Optional<User> findByEmail(String email);
    int count();
    List<User> findAll();
}
