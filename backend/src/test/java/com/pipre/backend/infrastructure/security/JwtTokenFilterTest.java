package com.pipre.backend.infrastructure.security;

import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.role.Role;
import com.auth0.jwt.interfaces.*;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class JwtTokenFilterTest {
    final JwtUtils jwt=mock(JwtUtils.class);final UserRepositoryPort users=mock(UserRepositoryPort.class);final RoleRepositoryPort roles=mock(RoleRepositoryPort.class);
    @AfterEach void cleanup(){SecurityContextHolder.clearContext();}
    void run(List<String> claimed,List<String> actual,boolean active)throws Exception {
        var decoded=mock(DecodedJWT.class);var claim=mock(Claim.class);when(jwt.validateToken("token")).thenReturn(decoded);when(jwt.extractUsername(decoded)).thenReturn("a@test.invalid");when(decoded.getClaim("roles")).thenReturn(claim);when(claim.asList(String.class)).thenReturn(claimed);
        when(users.findByEmail("a@test.invalid")).thenReturn(Optional.of(User.builder().email("a@test.invalid").isActive(active).idRoleList(actual).build()));
        when(roles.findAll()).thenReturn(List.of(Role.builder().idRole("student").name("STUDENT").build(),Role.builder().idRole("teacher").name("TEACHER").build()));
        var request=new MockHttpServletRequest();request.addHeader("Authorization","Bearer token");new JwtTokenFilter(jwt,users,roles).doFilter(request,new MockHttpServletResponse(),new MockFilterChain());
    }
    @Test void authenticatesOnlyMatchingLiveRoles()throws Exception{run(List.of("ROLE_STUDENT"),List.of("student"),true);assertNotNull(SecurityContextHolder.getContext().getAuthentication());}
    @Test void revokedRoleInvalidatesOldToken()throws Exception{run(List.of("ROLE_TEACHER"),List.of("student"),true);assertNull(SecurityContextHolder.getContext().getAuthentication());}
    @Test void addedRoleRequiresFreshLogin()throws Exception{run(List.of("ROLE_STUDENT"),List.of("student","teacher"),true);assertNull(SecurityContextHolder.getContext().getAuthentication());}
    @Test void inactiveAccountCannotUseSignedToken()throws Exception{run(List.of("ROLE_STUDENT"),List.of("student"),false);assertNull(SecurityContextHolder.getContext().getAuthentication());}
    @Test void databaseFailureIsNotSilentlyReportedAsAnonymous()throws Exception{when(jwt.validateToken("token")).thenReturn(mock(DecodedJWT.class));when(jwt.extractUsername(any())).thenReturn("a@test.invalid");when(users.findByEmail(any())).thenThrow(new IllegalStateException("database unavailable"));var request=new MockHttpServletRequest();request.addHeader("Authorization","Bearer token");assertThrows(IllegalStateException.class,()->new JwtTokenFilter(jwt,users,roles).doFilter(request,new MockHttpServletResponse(),new MockFilterChain()));}
}
