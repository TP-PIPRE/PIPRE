package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.gamification.PlayerProfile;
import java.util.Optional;

public interface PlayerProfileRepositoryPort {
    Optional<PlayerProfile> findByIdStudent(String idStudent);
}
