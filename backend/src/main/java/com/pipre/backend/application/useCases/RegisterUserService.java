package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterUserCommand;
import com.pipre.backend.application.ports.input.RegisterUserUseCase;
import com.pipre.backend.application.ports.output.PasswordEncoderPort;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.role.Role;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.factories.UserFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RegisterUserService implements RegisterUserUseCase {

    private final UserRepositoryPort repositoryPort;
    private final RoleRepositoryPort roleRepositoryPort;
    private final PasswordEncoderPort passwordEncoderPort;

    @Override
    @Transactional
    public String execute(RegisterUserCommand command) {
        if (repositoryPort.existsByEmail(command.email())) {
           throw new BusinessException("El email ya se encuentra registrado.");
        }

        if (command.roleIdList() == null || command.roleIdList().isEmpty()) {
            throw new BusinessException("El usuario debe tener al menos un rol.");
        }

        List<Role> allRoles = roleRepositoryPort.findAll();
        List<String> validRoleIds = allRoles.stream()
                .filter(r -> List.of("STUDENT", "TEACHER", "ADMIN").contains(r.getName().toUpperCase()))
                .map(Role::getIdRole)
                .toList();

        for (String roleId : command.roleIdList()) {
            if (!validRoleIds.contains(roleId)) {
                throw new BusinessException("El rol con ID " + roleId + " no es válido o no existe en la base de datos.");
            }
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
