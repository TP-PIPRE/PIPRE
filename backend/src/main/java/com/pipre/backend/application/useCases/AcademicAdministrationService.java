package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.exceptions.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AcademicAdministrationService {
    private final AcademicAdministrationPort administration;
    private final AcademicAccessRepositoryPort access;
    private final UserRepositoryPort users;
    private final RoleRepositoryPort roles;
    private final GroupRepositoryPort groups;
    private final CourseRepositoryPort courses;
    private final ActivityRepositoryPort activities;
    public record UserAccess(String idUser,String firstName,String lastName,String email,List<String> roles,boolean active) {}
    public record Snapshot(List<UserAccess> users,List<GroupDTO> groups,List<CourseDTO> courses,List<AcademicAdministrationPort.Assignment> assignments,String studentRankingVisibility) {}
    @Transactional(readOnly=true)
    public Snapshot snapshot() {
        Map<String,String> names=new HashMap<>();roles.findAll().forEach(role->names.put(role.getIdRole(),role.getName()));
        return new Snapshot(users.findAll().stream().map(user->new UserAccess(user.getIdUser(),user.getFirstName(),user.getLastName(),user.getEmail(),user.getIdRoleList().stream().map(names::get).filter(Objects::nonNull).toList(),Boolean.TRUE.equals(user.getIsActive()))).toList(),
            groups.findAll().stream().map(group->new GroupDTO(group.getIdGroup(),group.getGroupName(),group.getDescription())).toList(),
            courses.findAll().stream().map(course->new CourseDTO(course.getIdCourse(),course.getName(),course.getDescription(),course.getLevel().name())).toList(),administration.assignments(),access.studentRankingVisibility());
    }
    @Transactional public GroupDTO createGroup(String name,String description) {return administration.createGroup(name.trim(),description);}
    @Transactional public void teacherGroup(String teacher,String group,boolean assigned) {if(assigned){users.lockById(teacher).orElseThrow(()->new ResourceNotFoundException("El usuario no existe."));teacher(teacher);}administration.teacherGroup(teacher,group,assigned);}
    @Transactional public void teacherCourse(String teacher,String course,boolean assigned) {if(assigned){users.lockById(teacher).orElseThrow(()->new ResourceNotFoundException("El usuario no existe."));teacher(teacher);}administration.teacherCourse(teacher,course,assigned);}
    @Transactional public void groupCourse(String group,String course,boolean assigned) {
        courses.findById(course).orElseThrow(()->new ResourceNotFoundException("El curso no existe."));administration.groupCourse(group,course,assigned);
    }
    @Transactional public void groupActivity(String group,String activity,boolean assigned) {
        administration.lockGroup(group);
        activities.findById(activity).orElseThrow(()->new ResourceNotFoundException("La actividad no existe."));
        if(assigned&&!administration.groupCourses(group).contains(access.activityCourse(activity)))throw new BusinessException("Asigna primero el curso de esta actividad al aula.");
        administration.groupActivity(group,activity,assigned);
    }
    @Transactional(readOnly=true) public PageResponse<ActivityDTO> groupActivities(String group,org.springframework.data.domain.Pageable pageable) {
        groups.findById(group).orElseThrow(()->new ResourceNotFoundException("El aula no existe."));
        return PageResponse.from(activities.assignedToGroup(group,org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(),pageable.getPageSize())).map(ActivityDtoMapper::toDTO));
    }
    public void requireStudent(String id) {requireRole(id,"STUDENT");}
    private void teacher(String id) {requireRole(id,"TEACHER");}
    private void requireRole(String id,String name) {
        var user=users.findById(id).orElseThrow(()->new ResourceNotFoundException("El usuario no existe."));
        var expected=roles.findAll().stream().filter(role->role.getName().equals(name)).map(role->role.getIdRole()).findFirst().orElseThrow();
        if(!user.getIdRoleList().contains(expected))throw new BusinessException("El usuario no tiene el rol "+name+".");
    }
    @Transactional public void rankingVisibility(String value) {
        if(!Set.of("HIDDEN","CLASSROOM","GLOBAL").contains(value))throw new BusinessException("Visibilidad de ranking no válida.");
        administration.rankingVisibility(value);
    }
}
