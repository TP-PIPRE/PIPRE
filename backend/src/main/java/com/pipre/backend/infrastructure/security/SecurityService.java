package com.pipre.backend.infrastructure.security;

import com.pipre.backend.application.ports.output.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("securityService")
@RequiredArgsConstructor
public class SecurityService {
    private final UserRepositoryPort userRepositoryPort;

    public boolean isCurrentUser(String userId) {
        if (userId == null) {
            return false;
        }
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepositoryPort.findByEmail(email)
                .map(user -> userId.equals(user.getIdUser()))
                .orElse(false);
    }
}
