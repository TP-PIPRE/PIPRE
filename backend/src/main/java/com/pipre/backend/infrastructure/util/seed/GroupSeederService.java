package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.application.ports.output.GroupRepositoryPort;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.Group;
import com.pipre.backend.domain.entities.Ranking;
import com.pipre.backend.domain.entities.role.Role;
import com.pipre.backend.domain.entities.user.User;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class GroupSeederService {

    private final Faker faker = new Faker();
    private final UserRepositoryPort userRepositoryPort;
    private final RoleRepositoryPort roleRepositoryPort;
    private final GroupRepositoryPort groupRepositoryPort;
    private final RankingRepositoryPort rankingRepositoryPort;

    @Transactional
    public void seedCourses() {

        int NUMBER_OF_GROUPS = 1;
        String studentRoleId = getRoleIdByName("STUDENT");

        List<String> studentsIdList = userRepositoryPort.findAll().stream()
                .filter(user -> user.getIdRoleList().contains(studentRoleId))
                .map(User::getIdUser)
                .toList();

        System.out.println("===============================");
        System.out.println(studentsIdList);
        List<List<String>> studentsPerGroup = new ArrayList<>();

        for (int i = 0; i < NUMBER_OF_GROUPS; i++) {
            studentsPerGroup.add(new ArrayList<>());
        }
        for (int i = 0; i < studentsIdList.size(); i++) {
            int groupIndex = i % NUMBER_OF_GROUPS;
            studentsPerGroup.get(groupIndex).add(studentsIdList.get(i));
        }

        for (int i = 0; i < NUMBER_OF_GROUPS; i++) {
            List<String> assignedStudents = studentsPerGroup.get(i);
            Group group = Group.builder()
                    .idGroup(UUID.randomUUID().toString())
                    .groupName("Grupo " + faker.funnyName().name())
                    .idGroupStudentList(assignedStudents)
                    .build();
            groupRepositoryPort.save(group);
            String groupId = group.getIdGroup();
            System.out.println(assignedStudents);
            System.out.println(studentsPerGroup);

            for (String studentId : assignedStudents) {
                double randomValue = ThreadLocalRandom.current().nextDouble(10.0, 500.0);
                BigDecimal randomPoints = BigDecimal.valueOf(randomValue).setScale(2, RoundingMode.HALF_UP);
                Ranking ranking = Ranking.builder()
                        .idRanking(UUID.randomUUID().toString())
                        .totalPoints(randomPoints)
                        .position(0)
                        .idGroup(groupId)
                        .idStudent(studentId)
                        .build();
                rankingRepositoryPort.save(ranking);
            }
            rankingRepositoryPort.sortRanking(groupId);
        }
    }

    private String getRoleIdByName(String name) {
        return roleRepositoryPort.findAll().stream()
                .filter(r -> r.getName().equalsIgnoreCase(name))
                .map(Role::getIdRole)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Error: El rol " + name + " no existe en la base de datos."));
    }
}