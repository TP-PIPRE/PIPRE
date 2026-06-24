package com.pipre.backend.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

public class LoginRateLimiterFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, Queue<Instant>> requestAttempts = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final int WINDOW_SECONDS = 60;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if ("POST".equalsIgnoreCase(request.getMethod()) && "/api/v1/auth/login".equals(request.getRequestURI())) {
            String ip = getClientIp(request);
            Instant now = Instant.now();

            requestAttempts.putIfAbsent(ip, new ConcurrentLinkedQueue<>());
            Queue<Instant> attempts = requestAttempts.get(ip);

            // Clean up old attempts
            while (!attempts.isEmpty() && attempts.peek().isBefore(now.minusSeconds(WINDOW_SECONDS))) {
                attempts.poll();
            }

            if (attempts.size() >= MAX_ATTEMPTS) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\": \"Demasiados intentos\", \"message\": \"Límite de 5 intentos por minuto excedido por IP.\"}");
                return;
            }

            attempts.offer(now);
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
