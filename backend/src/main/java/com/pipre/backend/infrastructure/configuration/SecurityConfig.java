package com.pipre.backend.infrastructure.configuration;

import com.pipre.backend.infrastructure.security.JwtTokenFilter;
import com.pipre.backend.infrastructure.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.pipre.backend.infrastructure.security.LoginRateLimiterFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@org.springframework.scheduling.annotation.EnableScheduling
public class SecurityConfig {

    private final JwtUtils jwtUtils;
    private final com.pipre.backend.application.ports.output.UserRepositoryPort users;
    private final com.pipre.backend.application.ports.output.RoleRepositoryPort roles;
    private final BrowserSecurityProperties browser;
    private final com.pipre.backend.infrastructure.security.LoginAttemptLimiter loginLimiter;
    @org.springframework.beans.factory.annotation.Value("${pipre.security.trusted-proxies:}")
    private String trustedProxies;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        var csrfRepository=new org.springframework.security.web.csrf.CookieCsrfTokenRepository();
        csrfRepository.setCookieCustomizer(cookie->cookie.httpOnly(true).secure(browser.isCookieSecure()).sameSite(browser.getCookieSameSite()).path("/"));
        return http
                .cors(cors -> {})
                .csrf(csrf->csrf.csrfTokenRepository(csrfRepository).requireCsrfProtectionMatcher(com.pipre.backend.infrastructure.security.BrowserCsrf::required))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions.accessDeniedHandler(new com.pipre.backend.infrastructure.security.CsrfDeniedHandler()).authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"message\":\"Inicia sesión para continuar.\"}");
                }))
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                        .requestMatchers("/").permitAll()

                        // 2. Rutas públicas de Autenticación y Registro
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/users").permitAll()

                        // 3. Rutas de Scalar UI y OpenAPI v3
                        .requestMatchers("/v3/api-docs/**").permitAll()
                        .requestMatchers("/scalar/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()

                        // 4. El resto requiere autenticación
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new LoginRateLimiterFilter(loginLimiter,trustedProxies), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new com.pipre.backend.infrastructure.security.RequestCorrelationFilter(),org.springframework.security.web.csrf.CsrfFilter.class)
                .addFilterBefore(new JwtTokenFilter(jwtUtils,users,roles), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
