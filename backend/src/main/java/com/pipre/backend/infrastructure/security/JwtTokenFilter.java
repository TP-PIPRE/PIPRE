package com.pipre.backend.infrastructure.security;

import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtTokenFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private final com.pipre.backend.application.ports.output.UserRepositoryPort users;
    private final com.pipre.backend.application.ports.output.RoleRepositoryPort roleRepository;

    public JwtTokenFilter(JwtUtils jwtUtils,com.pipre.backend.application.ports.output.UserRepositoryPort users,
            com.pipre.backend.application.ports.output.RoleRepositoryPort roleRepository) {
        this.jwtUtils = jwtUtils;
        this.users=users;this.roleRepository=roleRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = null;

        // Try extracting JWT from Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // Fallback: extract JWT from cookies
        if (token == null && request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }



        if (token != null) {
            DecodedJWT decoded;
            try {decoded=jwtUtils.validateToken(token);}
            catch(com.auth0.jwt.exceptions.JWTVerificationException|IllegalArgumentException invalid) {
                SecurityContextHolder.clearContext();filterChain.doFilter(request,response);return;
            }
            String username=jwtUtils.extractUsername(decoded);
            var user=username==null||username.isBlank()?java.util.Optional.<com.pipre.backend.domain.entities.user.User>empty():users.findByEmail(username);
            if(user.isPresent()&&Boolean.TRUE.equals(user.get().getIsActive())) {
                var catalog=new java.util.HashMap<String,String>();roleRepository.findAll().forEach(role->catalog.put(role.getIdRole(),"ROLE_"+role.getName()));
                var actual=new java.util.HashSet<>(user.get().getIdRoleList().stream().map(catalog::get).filter(java.util.Objects::nonNull).toList());
                java.util.List<String> claimed;
                try{claimed=decoded.getClaim("roles").asList(String.class);}
                catch(com.auth0.jwt.exceptions.JWTDecodeException invalid){SecurityContextHolder.clearContext();filterChain.doFilter(request,response);return;}
                // A role change requires a fresh login; signed but stale claims never retain privileges.
                if(claimed!=null&&actual.equals(new java.util.HashSet<>(claimed))) {
                    var authorities=actual.stream().map(org.springframework.security.core.authority.SimpleGrantedAuthority::new).toList();
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(username,null,authorities));
                } else SecurityContextHolder.clearContext();
            } else SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }
}
