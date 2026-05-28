package com.pipre.backend.application.ports.output;

public interface PasswordEncoderPort {
    String encode(String passwordHash);
}
