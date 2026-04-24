package com.pipre.backend.application.usecase;

import com.pipre.backend.domain.model.User;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.UserRequestDTO;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UUID getUserUuid(UserRequestDTO requestDTO) {
        User newUser = new User(
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
        userRepository.save(newUser);
        return newUser.getIdUser();
    }
}
