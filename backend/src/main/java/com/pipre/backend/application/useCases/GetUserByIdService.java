package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.UserDTO;
import com.pipre.backend.application.ports.input.GetUserByIdUseCase;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetUserByIdService implements GetUserByIdUseCase {

    private final UserRepositoryPort repositoryPort;

    @Override
    @Transactional(readOnly = true)
    public UserDTO execute(String userId) {
        return repositoryPort.findById(userId)
                .map(user -> new UserDTO(
                        user.getIdUser(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail()
                ))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));
    }
}
