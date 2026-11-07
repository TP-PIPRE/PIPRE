package com.pipre.backend.application.useCases;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.role.Role;
import com.pipre.backend.domain.exceptions.BusinessException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class SetUserActiveServiceTest {
    final UserRepositoryPort users=mock(UserRepositoryPort.class);final RoleRepositoryPort roles=mock(RoleRepositoryPort.class);final SetUserActiveService service=new SetUserActiveService(users,roles);
    void given(boolean active,String role){when(users.lockById("u")).thenReturn(Optional.of(User.builder().email("user@test.invalid").idUser("u").idRoleList(List.of(role)).isActive(active).build()));when(roles.findAll()).thenReturn(List.of(Role.builder().idRole("admin").name("ADMIN").build()));}
    @Test void cannotDeactivateTheLastAdministrator(){given(true,"admin");when(roles.activeAdministrators()).thenReturn(1L);assertThrows(BusinessException.class,()->service.execute("u",false));verify(users,never()).save(any());}
    @Test void deactivationPreservesRolesAndIdentity(){given(true,"student");service.execute("u",false);verify(users).save(argThat(user->user.getIdUser().equals("u")&&!user.getIsActive()&&user.getIdRoleList().equals(List.of("student"))));}
    @Test void reactivationPreservesTheAccount(){given(false,"student");service.execute("u",true);verify(users).save(argThat(User::getIsActive));}
}
