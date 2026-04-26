package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpa;
import com.pipre.backend.adapters.out.persistence.repository.RoleRepository;
import com.pipre.backend.adapters.out.persistence.repository.UserRepository;
import com.pipre.backend.infrastructure.util.PasswordUtil;
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
        RoleJpa teacherRoleJpa = getOrCreateRole("teacher", "Profesor");
        RoleJpa studentRoleJpa = getOrCreateRole("student", "Estudiante");

        List<UserJpa> userJpas = new ArrayList<>();

        // 2. Generar Profesores
        for (int i = 0; i < 5; i++) {
            userJpas.add(fakeTeacher(teacherRoleJpa));
        }

        // 3. Generar Estudiantes
        for (int i = 0; i < 30; i++) {
            userJpas.add(fakeStudent(studentRoleJpa));
        }

        // 4. Guardar en lote para mejor rendimiento
        userRepository.saveAll(userJpas);
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
        // IMPORTANTE: Asegúrate que getRoles() devuelva una lista inicializada (new ArrayList<>())
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
        return UserJpa.builder()
                .firstName(faker.name().firstName())
                .lastName(faker.name().lastName())
                .email(faker.internet().emailAddress()) // Usar unique() evita colisiones
                .passwordHash(PasswordUtil.hash("123456"))
                .institution("Colegio Tech")
                .isActive(true)
                .roleJpas(new ArrayList<>())
                .registeredAt(LocalDateTime.now())
                .build();
    }
}