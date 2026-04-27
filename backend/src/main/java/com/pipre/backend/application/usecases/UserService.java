package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.controller.dto.UserResponseDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpa;
import com.pipre.backend.adapters.in.controller.dto.UserRequestDTO;
import com.pipre.backend.adapters.out.persistence.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponseDTO getUser(UUID id) {
        UserJpa userJpa = userRepository.findUserJpaByIdUser(id);
        return new UserResponseDTO(
                userJpa.getIdUser(),
                userJpa.getFirstName(),
                userJpa.getLastName(),
                userJpa.getEmail()
        );
    }

    @Transactional
    public UUID postUser(UserRequestDTO requestDTO) {
        UserJpa newUserJpa = UserJpa.builder()
                .firstName(requestDTO.firstName())
                .lastName(requestDTO.lastName())
                .email(requestDTO.email())
                .passwordHash(passwordEncoder.encode(requestDTO.passwordHash()))
                .isActive(true)
                .registeredAt(LocalDateTime.now())
                .build();

        userRepository.save(newUserJpa);
        return newUserJpa.getIdUser();
    }
}
