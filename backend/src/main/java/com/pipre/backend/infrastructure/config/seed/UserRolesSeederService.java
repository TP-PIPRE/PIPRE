package com.pipre.backend.infrastructure.config.seed;

import com.pipre.backend.domain.model.Role;
import com.pipre.backend.domain.model.User;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.RoleRepository;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.UserRepository;
import com.pipre.backend.infrastructure.config.PasswordUtil;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserRolesSeederService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    private final Faker faker = new Faker();
    private final Random random = new Random();

    public boolean isDatabaseSeeded() {
        return userRepository.count() > 0;
    }

    @Transactional // Recomendado para asegurar que los roles y usuarios se liguen bien
    public void seedUsers() {
        // 1. Obtener o crear roles
        Role teacherRole = getOrCreateRole("teacher", "Profesor");
        Role studentRole = getOrCreateRole("student", "Estudiante");

        List<User> users = new ArrayList<>();

        // 2. Generar Profesores
        for (int i = 0; i < 5; i++) {
            users.add(fakeTeacher(teacherRole));
        }

        // 3. Generar Estudiantes
        for (int i = 0; i < 30; i++) {
            users.add(fakeStudent(studentRole));
        }

        // 4. Guardar en lote para mejor rendimiento
        userRepository.saveAll(users);
    }

    private Role getOrCreateRole(String name, String desc) {
        return roleRepository.findRoleByName(name)
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name(name)
                                .description(desc)
                                .build()
                ));
    }

    private User fakeTeacher(Role role) {
        User u = baseUser();
        u.setAge(faker.number().numberBetween(30, 55));
        u.setZone("Zona " + faker.number().numberBetween(1, 5));
        // IMPORTANTE: Asegúrate que getRoles() devuelva una lista inicializada (new ArrayList<>())
        u.getRoles().add(role);
        return u;
    }

    private User fakeStudent(Role role) {
        User u = baseUser();
        u.setAge(faker.number().numberBetween(10, 18));
        u.setGrade((1 + random.nextInt(5)) + "ro");
        u.setZone("Zona " + (1 + random.nextInt(5)));
        u.getRoles().add(role);
        return u;
    }

    private User baseUser() {
        return User.builder()
                .firstName(faker.name().firstName())
                .lastName(faker.name().lastName())
                .email(faker.internet().emailAddress()) // Usar unique() evita colisiones
                .passwordHash(PasswordUtil.hash("123456"))
                .institution("Colegio Tech")
                .isActive(true)
                .roles(new ArrayList<>())
                .registeredAt(LocalDateTime.now())
                .build();
    }
}