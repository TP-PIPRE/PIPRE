package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpa;
import com.pipre.backend.adapters.in.controller.dto.UserRequestDTO;
import com.pipre.backend.adapters.out.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UUID getUserUuid(UserRequestDTO requestDTO) {
        UserJpa newUserJpa = new UserJpa(
                null,
                requestDTO.firstName(),
                requestDTO.lastName(),
                requestDTO.age(),
                requestDTO.grade(),
                requestDTO.email(),
                requestDTO.passwordHash(),
                requestDTO.institution(),
                requestDTO.zone(),
                true,
                LocalDateTime.now(),
                null
        );
        userRepository.save(newUserJpa);
        return newUserJpa.getIdUser();
    }
}
