package com.pipre.backend.infrastructure.config;

import com.pipre.backend.domain.model.*;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.*;
import com.pipre.backend.infrastructure.config.seed.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.*;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final UserRolesSeederService userSeederService;
    private final CourseSeederService courseSeederService;
    private final ProgressSeederService progressSeederService;
    private final SupportAnalyticSeederService supportAnalyticSeederService;
    private final GroupSeederService groupSeederService;

    @Bean
    CommandLineRunner seed() {
        return args -> {
            if (!userSeederService.isDatabaseSeeded()) {
                userSeederService.seedUsers();
                courseSeederService.seedCourses();
                progressSeederService.seedProgress();
                supportAnalyticSeederService.seedAnalytics();
                groupSeederService.seedGroups();
                System.out.println("Base de datos sembrada");
            } else {
                System.out.println("La base de datos ya contiene datos. No se sembró nada.");
            }
        };
    }
}