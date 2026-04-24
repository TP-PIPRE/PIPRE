package com.pipre.backend.infrastructure.config.seed;

import com.pipre.backend.domain.model.Group;
import com.pipre.backend.domain.model.GroupStudent;
import com.pipre.backend.domain.model.User;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.GroupRepository;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.GroupStudentRepository;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.UserRepository;
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
        List<User> teachers = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("teacher")))
                .toList();

        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("student")))
                .toList();

        if (teachers.isEmpty() || students.isEmpty()) {
            System.out.println("⚠️ Se requieren profesores y estudiantes para crear grupos.");
            return;
        }

        // 2. Crear grupos (asignar un par de grupos a cada profesor)
        int studentIndex = 0;
        for (User teacher : teachers) {
            for (int i = 0; i < 2; i++) { // 2 grupos por profesor
                Group group = createFakeGroup(teacher);

                // 3. Asignar estudiantes al grupo (ej. 5 estudiantes por grupo)
                List<GroupStudent> groupMembers = new ArrayList<>();
                for (int j = 0; j < 5 && studentIndex < students.size(); j++) {
                    User student = students.get(studentIndex++);
                    groupMembers.add(createFakeGroupStudent(group, student));
                }

                // 4. Calcular posiciones del ranking basadas en puntos
                assignRankings(groupMembers);
            }
        }
    }

    private Group createFakeGroup(User teacher) {
        Group group = Group.builder()
                .teacher(teacher)
                .groupName("Robótica " + faker.team().name())
                .grade(faker.options().option("1ro", "2do", "3ro", "4to", "5to"))
                .section(faker.options().option("A", "B", "C"))
                .build();
        return groupRepository.save(group);
    }

    private GroupStudent createFakeGroupStudent(Group group, User student) {
        return GroupStudent.builder()
                .group(group)
                .student(student)
                .totalPoints(random.nextInt(100, 5000))
                .build();
        // No guardamos aún para poder ordenar por puntos primero
    }

    private void assignRankings(List<GroupStudent> members) {
        // Ordenar de mayor a menor puntaje
        members.sort((a, b) -> b.getTotalPoints().compareTo(a.getTotalPoints()));

        for (int i = 0; i < members.size(); i++) {
            GroupStudent gs = members.get(i);
            gs.setPosition(i + 1); // La posición 1 es el que tiene más puntos
            groupStudentRepository.save(gs);
        }
    }
}