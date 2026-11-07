package com.pipre.backend.infrastructure.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.MDC;
import java.io.IOException;
import java.util.UUID;

public class RequestCorrelationFilter extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException {
        String supplied=request.getHeader("X-Request-ID");
        String id=supplied!=null&&supplied.matches("[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}")?supplied:UUID.randomUUID().toString();
        response.setHeader("X-Request-ID",id);MDC.put("requestId",id);
        try{chain.doFilter(request,response);}finally{MDC.remove("requestId");}
    }
}
