package com.pipre.backend.infrastructure.security;

import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.domain.entities.role.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepositoryPort userRepositoryPort;
    private final RoleRepositoryPort roleRepositoryPort;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        User user = userRepositoryPort.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        Map<String, String> roleMap = roleRepositoryPort.findAll().stream()
                .collect(Collectors.toMap(Role::getIdRole, Role::getName));

        var authorities = user.getIdRoleList().stream()
                .map(roleId -> new SimpleGrantedAuthority("ROLE_" + roleMap.getOrDefault(roleId, "UNKNOWN").toUpperCase()))
                .collect(Collectors.toList());

        boolean accountNonLocked = user.getLockedUntil() == null || user.getLockedUntil().isBefore(java.time.LocalDateTime.now());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.getIsActive(),
                true, true, accountNonLocked,
                authorities
        );
    }
}