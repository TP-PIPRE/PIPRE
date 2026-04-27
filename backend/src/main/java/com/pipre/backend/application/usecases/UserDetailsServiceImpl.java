package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpa;
import com.pipre.backend.adapters.out.persistence.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Buscamos al usuario por email (que es tu identificador de login)
        UserJpa userJpa = userRepository.findUserJpaByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));

        // Mapeamos los roles de tu entidad a GrantedAuthority de Spring Security
        var authorities = userJpa.getRoleJpas().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                .collect(Collectors.toList());

        return new User(
                userJpa.getEmail(),
                userJpa.getPasswordHash(),
                userJpa.getIsActive(),
                true, true, true,
                authorities
        );
    }
}