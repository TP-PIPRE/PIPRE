package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.UserResponseDTO;
import com.pipre.backend.application.ports.input.GetUserByIdUseCase;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetUserByIdService implements GetUserByIdUseCase {

    private final UserRepositoryPort repositoryPort;

    @Override
    public UserResponseDTO execute(String userId) {
        return repositoryPort.findById(userId)
                .map(user -> new UserResponseDTO(
                        user.getIdUser(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail()
                ))
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
    }
}
