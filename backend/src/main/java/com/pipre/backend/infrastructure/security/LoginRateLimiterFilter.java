package com.pipre.backend.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import java.io.IOException;
import java.util.*;

public class LoginRateLimiterFilter extends OncePerRequestFilter {
    private final LoginAttemptLimiter limiter;
    private final List<IpAddressMatcher> proxies;
    public LoginRateLimiterFilter(LoginAttemptLimiter limiter,String trustedProxies) {
        this.limiter=limiter;this.proxies=Arrays.stream(trustedProxies.split(",")).map(String::trim).filter(value->!value.isEmpty()).map(value->{
            if(!literal(value.split("/",-1)[0]))throw new IllegalArgumentException("trusted-proxies requiere IP/CIDR literal.");
            return new IpAddressMatcher(value);
        }).toList();
    }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        if(request.getMethod().equals("POST")&&request.getRequestURI().equals("/api/v1/auth/login")) {
            int retry=limiter.retryAfter(clientAddress(request));
            if(retry>0) {
                response.setStatus(429);response.setHeader("Retry-After",String.valueOf(retry));response.setContentType("application/json");response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"message\":\"Demasiados intentos. Espera un minuto y vuelve a intentarlo.\"}");return;
            }
        }
        chain.doFilter(request,response);
    }
    String clientAddress(HttpServletRequest request) {
        String remote=request.getRemoteAddr(),header=request.getHeader("X-Forwarded-For");
        if(!trusted(remote)||header==null||header.length()>2048)return remote;
        String[] hops=header.split(",",-1);
        for(int index=hops.length-1;index>=0;index--) {
            String hop=hops[index].trim();
            // Literal addresses only: no hostname lookup, port, brackets or arbitrary input.
            if(!literal(hop))return remote;
            try{new IpAddressMatcher(hop);if(!trusted(hop))return java.net.InetAddress.getByName(hop).getHostAddress();}
            catch(IllegalArgumentException|java.net.UnknownHostException invalid){return remote;}
        }
        return remote;
    }
    private boolean trusted(String address) {return proxies.stream().anyMatch(proxy->proxy.matches(address));}
    private static boolean literal(String address) {
        if(address.length()>45)return false;
        if(address.contains(":"))return address.matches("[0-9a-fA-F:.]+");
        if(!address.matches("([0-9]{1,3}\\.){3}[0-9]{1,3}"))return false;
        return Arrays.stream(address.split("\\.")).allMatch(part->Integer.parseInt(part)<=255);
    }
}
