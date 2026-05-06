package com.pipre.backend.adapters.out.security;

import com.pipre.backend.application.ports.output.PasswordEncoderPort;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BCryptPasswordEncoderAdapter implements PasswordEncoderPort {

    private final PasswordEncoder passwordEncoder;

    @Override
    public String encode(String passwordHash) {
        return passwordEncoder.encode(passwordHash);
    }
}
