package com.pipre.backend.infrastructure.security;

import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuthenticationFailureListener {

    private final UserRepositoryPort userRepositoryPort;

    @EventListener
    public void onAuthenticationFailure(AuthenticationFailureBadCredentialsEvent event) {
        String email = event.getAuthentication().getName();
        userRepositoryPort.findByEmail(email).ifPresent(user -> {
            int attempts = user.getFailedAttempts() + 1;
            User.Builder builder = user.toBuilder().failedAttempts(attempts);
            if (attempts >= 5) {
                builder.lockedUntil(LocalDateTime.now().plusMinutes(15));
            }
            userRepositoryPort.save(builder.build());
        });
    }
}
