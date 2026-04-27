package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpa;
import com.pipre.backend.adapters.out.persistence.repository.RoleRepository;
import com.pipre.backend.adapters.out.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;
    private final Faker faker = new Faker();
    private final Random random = new Random();

    public boolean isDatabaseSeeded() {
        return userRepository.count() > 0;
    }

    @Transactional
    public void seedUsers() {
        // 1. Obtener o crear roles (Añadimos 'admin')
        RoleJpa adminRoleJpa = getOrCreateRole("admin", "Administrador");
        RoleJpa teacherRoleJpa = getOrCreateRole("teacher", "Profesor");
        RoleJpa studentRoleJpa = getOrCreateRole("student", "Estudiante");

        List<UserJpa> userJpas = new ArrayList<>();

        // 2. CUENTAS HARCODEADAS (Desarrollo)
        userJpas.add(createFixedUser("Administrador", "Sistema", "admin@pipre.com", adminRoleJpa));
        userJpas.add(createFixedUser("Docente", "Prueba", "docente@pipre.com", teacherRoleJpa));
        userJpas.add(createFixedUser("Alumno", "Prueba", "alumno@pipre.com", studentRoleJpa));

        // 3. Generar Profesores Aleatorios
        for (int i = 0; i < 5; i++) {
            userJpas.add(fakeTeacher(teacherRoleJpa));
        }

        // 4. Generar Estudiantes Aleatorios
        for (int i = 0; i < 30; i++) {
            userJpas.add(fakeStudent(studentRoleJpa));
        }

        // 5. Guardar
        userRepository.saveAll(userJpas);
    }

    // Método para crear los usuarios con credenciales fijas
    private UserJpa createFixedUser(String firstName, String lastName, String email, RoleJpa role) {
        return UserJpa.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .passwordHash(passwordEncoder.encode("123"))
                .institution("Colegio Central")
                .isActive(true)
                .roleJpas(new ArrayList<>(List.of(role)))
                .registeredAt(LocalDateTime.now())
                .build();
    }

    private RoleJpa getOrCreateRole(String name, String desc) {
        return roleRepository.findRoleByName(name)
                .orElseGet(() -> roleRepository.save(
                        RoleJpa.builder()
                                .name(name)
                                .description(desc)
                                .build()
                ));
    }

    private UserJpa fakeTeacher(RoleJpa roleJpa) {
        UserJpa u = baseUser();
        u.setAge(faker.number().numberBetween(30, 55));
        u.setZone("Zona " + faker.number().numberBetween(1, 5));
        u.getRoleJpas().add(roleJpa);
        return u;
    }

    private UserJpa fakeStudent(RoleJpa roleJpa) {
        UserJpa u = baseUser();
        u.setAge(faker.number().numberBetween(10, 18));
        u.setGrade((1 + random.nextInt(5)) + "ro");
        u.setZone("Zona " + (1 + random.nextInt(5)));
        u.getRoleJpas().add(roleJpa);
        return u;
    }

    private UserJpa baseUser() {
        String randomEmail = faker.number().digits(5) + faker.internet().emailAddress();

        return UserJpa.builder()
                .firstName(faker.name().firstName())
                .lastName(faker.name().lastName())
                .email(randomEmail)
                .passwordHash(passwordEncoder.encode("123456"))
                .institution("Colegio Tech")
                .isActive(true)
                .roleJpas(new ArrayList<>())
                .registeredAt(LocalDateTime.now())
                .build();
    }
}