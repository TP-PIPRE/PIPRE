package com.pipre.backend.infrastructure.security;

import com.pipre.backend.application.ports.output.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationSuccessListener {

    private final UserRepositoryPort userRepositoryPort;

    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        String email = event.getAuthentication().getName();
        userRepositoryPort.findByEmail(email).ifPresent(user -> {
            if (user.getFailedAttempts() > 0 || user.getLockedUntil() != null) {
                userRepositoryPort.save(user.toBuilder()
                        .failedAttempts(0)
                        .lockedUntil(null)
                        .build());
            }
        });
    }
}
