package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterUserCommand;
import com.pipre.backend.application.ports.input.RegisterUserUseCase;
import com.pipre.backend.application.ports.output.PasswordEncoderPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.User;
import com.pipre.backend.domain.factories.UserFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegisterUserService implements RegisterUserUseCase {

    private final UserRepositoryPort repositoryPort;
    private final PasswordEncoderPort passwordEncoderPort;

    @Override
    @Transactional
    public String execute(RegisterUserCommand command) {
        if (repositoryPort.existsByEmail(command.email())) {
           throw new RuntimeException("El email ya se encuentra registrado.");
        }

        String encodedPassword = passwordEncoderPort.encode(command.passwordHash());

        User newUser = UserFactory.createNewUser(
                command.firstName(),
                command.lastName(),
                command.email(),
                encodedPassword,
                command.grade(),
                command.age(),
                command.roleIdList()
        );
        repositoryPort.save(newUser);

        return newUser.getIdUser();
    }
}
