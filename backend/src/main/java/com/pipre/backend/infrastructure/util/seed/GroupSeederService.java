package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupStudentJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpa;
import com.pipre.backend.adapters.out.persistence.repository.GroupRepository;
import com.pipre.backend.adapters.out.persistence.repository.GroupStudentRepository;
import com.pipre.backend.adapters.out.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class GroupSeederService {

    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final UserRepository userRepository;

    private final Faker faker = new Faker();
    private final Random random = new Random();

    @Transactional
    public void seedGroups() {
        // 1. Obtener profesores y estudiantes
        List<UserJpa> teachers = userRepository.findAll().stream()
                .filter(u -> u.getRoleJpas().stream().anyMatch(r -> r.getName().equals("teacher")))
                .toList();

        List<UserJpa> students = userRepository.findAll().stream()
                .filter(u -> u.getRoleJpas().stream().anyMatch(r -> r.getName().equals("student")))
                .toList();

        if (teachers.isEmpty() || students.isEmpty()) {
            System.out.println("⚠️ Se requieren profesores y estudiantes para crear grupos.");
            return;
        }

        // 2. Crear grupos (asignar un par de grupos a cada profesor)
        int studentIndex = 0;
        for (UserJpa teacher : teachers) {
            for (int i = 0; i < 2; i++) { // 2 grupos por profesor
                GroupJpa groupJpa = createFakeGroup(teacher);

                // 3. Asignar estudiantes al grupo (ej. 5 estudiantes por grupo)
                List<GroupStudentJpa> groupMembers = new ArrayList<>();
                for (int j = 0; j < 5 && studentIndex < students.size(); j++) {
                    UserJpa student = students.get(studentIndex++);
                    groupMembers.add(createFakeGroupStudent(groupJpa, student));
                }

                // 4. Calcular posiciones del ranking basadas en puntos
                assignRankings(groupMembers);
            }
        }
    }

    private GroupJpa createFakeGroup(UserJpa teacher) {
        GroupJpa groupJpa = GroupJpa.builder()
                .teacher(teacher)
                .groupName("Robótica " + faker.team().name())
                .grade(faker.options().option("1ro", "2do", "3ro", "4to", "5to"))
                .section(faker.options().option("A", "B", "C"))
                .build();
        return groupRepository.save(groupJpa);
    }

    private GroupStudentJpa createFakeGroupStudent(GroupJpa groupJpa, UserJpa student) {
        return GroupStudentJpa.builder()
                .groupJpa(groupJpa)
                .studentJpa(student)
                .totalPoints(random.nextInt(100, 5000))
                .build();
        // No guardamos aún para poder ordenar por puntos primero
    }

    private void assignRankings(List<GroupStudentJpa> members) {
        // Ordenar de mayor a menor puntaje
        members.sort((a, b) -> b.getTotalPoints().compareTo(a.getTotalPoints()));

        for (int i = 0; i < members.size(); i++) {
            GroupStudentJpa gs = members.get(i);
            gs.setPosition(i + 1); // La posición 1 es el que tiene más puntos
            groupStudentRepository.save(gs);
        }
    }
}