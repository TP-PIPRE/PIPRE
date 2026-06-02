package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.application.commands.RegisterUserCommand;
import com.pipre.backend.application.ports.input.RegisterUserUseCase;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.Role;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserRolesSeederService {

    private final RegisterUserUseCase registerUserUseCase;
    private final UserRepositoryPort userRepositoryPort;
    private final RoleRepositoryPort roleRepositoryPort;
    private final Faker faker = new Faker();

    public boolean isDatabaseSeeded() {
        return userRepositoryPort.count() > 0;
    }

    @Transactional
    public void seedUsers() {

        String adminId = getRoleIdByName("ADMIN");
        String teacherId = getRoleIdByName("TEACHER");
        String studentId = getRoleIdByName("STUDENT");

        registerUserUseCase.execute(new RegisterUserCommand(
                "Admin",
                "Principal",
                "admin@pipre.com",
                "123",
                "N/A",
                35,
                List.of(adminId)
        ));

        registerUserUseCase.execute(new RegisterUserCommand(
                "Alumno", "Prueba", "alumno@pipre.com", "123", "5to", 16, List.of(studentId)
        ));

        registerUserUseCase.execute(new RegisterUserCommand(
                "Docente", "Prueba", "docente@pipre.com", "123", "N/A", 42, List.of(teacherId)
        ));

        for (int i = 0; i < 10; i++) {
            registerUserUseCase.execute(generateFakeUser(studentId, 12, 18));
        }
    }

    private String getRoleIdByName(String name) {
        return roleRepositoryPort.findAll().stream()
                .filter(r -> r.getName().equalsIgnoreCase(name))
                .map(Role::getIdRole)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Error Crítico: El rol " + name + " no existe en la base de datos."));
    }

    private RegisterUserCommand generateFakeUser(String roleId, int minAge, int maxAge) {
        return new RegisterUserCommand(
                faker.name().firstName(),
                faker.name().lastName(),
                faker.internet().emailAddress(),
                "123",
                (faker.number().numberBetween(1, 6)) + "to",
                faker.number().numberBetween(minAge, maxAge),
                List.of(roleId)
        );
    }
}