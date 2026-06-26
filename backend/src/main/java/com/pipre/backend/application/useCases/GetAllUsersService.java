package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.UserDTO;
import com.pipre.backend.application.ports.input.GetAllUsersUseCase;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetAllUsersService implements GetAllUsersUseCase {
    private final UserRepositoryPort userRepositoryPort;

    @Override
    public List<UserDTO> execute() {
        return userRepositoryPort.findAll()
                .stream()
                .map(u -> new UserDTO(u.getIdUser(), u.getFirstName(), u.getLastName(), u.getEmail()))
                .toList();
    }
}
