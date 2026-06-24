package com.pipre.backend.infrastructure.util;

import com.pipre.backend.infrastructure.util.seed.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final UserRolesSeederService userSeederService;
    private final CourseSeederService courseSeederService;
    private final GroupSeederService groupSeederService;
    private final AdditionalDataSeederService additionalDataSeederService;

    @Bean
    CommandLineRunner seed() {
        return args -> {
            if (!userSeederService.isDatabaseSeeded()) {
                userSeederService.seedUsers();
                courseSeederService.seedCourses();
                groupSeederService.seedCourses();
                additionalDataSeederService.seedAdditionalData();
                System.out.println("Base de datos sembrada");
            } else {
                System.out.println("La base de datos ya contiene datos. No se sembró nada.");
            }
        };
    }
}