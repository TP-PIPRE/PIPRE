package com.pipre.backend.infrastructure.adapter.out.persistence.repository;

import com.pipre.backend.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
}
