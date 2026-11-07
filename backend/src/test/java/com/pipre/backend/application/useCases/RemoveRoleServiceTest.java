package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.role.Role;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RemoveRoleServiceTest {
    final UserRepositoryPort users=mock(UserRepositoryPort.class);
    final RoleRepositoryPort roles=mock(RoleRepositoryPort.class);
    final AcademicAdministrationPort assignments=mock(AcademicAdministrationPort.class);
    final RemoveRoleService service=new RemoveRoleService(users,roles,assignments);
    User user(List<String> ids){return User.builder().idUser("u").email("role@test.invalid").age(18).isActive(true).idRoleList(ids).build();}
    void given(List<String> ids,String role,String name){when(users.lockById("u")).thenReturn(Optional.of(user(ids)));when(roles.findAll()).thenReturn(List.of(Role.builder().idRole(role).name(name).build()));}
    @Test void cannotRemoveLastRole(){given(List.of("student"),"student","STUDENT");assertThrows(BusinessException.class,()->service.execute("u","student"));verify(users,never()).save(any());}
    @Test void cannotRemoveLastActiveAdministrator(){given(List.of("admin","student"),"admin","ADMIN");when(roles.activeAdministrators()).thenReturn(1L);assertThrows(BusinessException.class,()->service.execute("u","admin"));verify(users,never()).save(any());}
    @Test void teacherRemovalAlsoRevokesAssignments(){given(List.of("teacher","student"),"teacher","TEACHER");when(assignments.assignments()).thenReturn(List.of(new AcademicAdministrationPort.Assignment("u","g",null),new AcademicAdministrationPort.Assignment("u",null,"c"),new AcademicAdministrationPort.Assignment("other","g",null)));service.execute("u","teacher");verify(users).save(argThat(u->u.getIdRoleList().equals(List.of("student"))));verify(assignments).teacherGroup("u","g",false);verify(assignments).teacherCourse("u","c",false);verify(assignments,never()).teacherGroup("other","g",false);}
    @Test void retryIsIdempotent(){given(List.of("student"),"teacher","TEACHER");service.execute("u","teacher");verify(users,never()).save(any());}
}
