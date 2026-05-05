package com.pipre.backend.application.usecases;

import com.pipre.backend.application.ports.input.RegisterUserUseCase;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.application.usecases.commands.RegisterUserCommand;
import com.pipre.backend.domain.entities.User;
import com.pipre.backend.domain.factories.UserFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegisterUserService implements RegisterUserUseCase {

    private final UserRepositoryPort repositoryPort;

    @Override
    @Transactional
    public String execute(RegisterUserCommand command) {
        if (repositoryPort.existsByEmail(command.email())) {
           throw new RuntimeException("El email ya se encuentra registrado.");
        }

        User newUser = UserFactory.createNewUser(
                command.firstName(),
                command.lastName(),
                command.email(),
                command.passwordHash(),
                command.grade(),
                command.age(),
                command.roleIdList()
        );
        repositoryPort.save(newUser);

        return newUser.getIdUser();
    }
}
