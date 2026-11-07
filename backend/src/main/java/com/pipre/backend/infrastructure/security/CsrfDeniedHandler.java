package com.pipre.backend.infrastructure.security;

import jakarta.servlet.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import java.io.IOException;

/** CsrfFilter rejects before controller execution, so this specific response can safely renew the token. */
public final class CsrfDeniedHandler implements AccessDeniedHandler {
    @Override public void handle(HttpServletRequest request,HttpServletResponse response,AccessDeniedException failure)throws IOException,jakarta.servlet.ServletException {
        if(!(failure instanceof org.springframework.security.web.csrf.CsrfException)) {
            new org.springframework.security.web.access.AccessDeniedHandlerImpl().handle(request,response,failure);return;
        }
        response.setStatus(403);response.setContentType("application/json");response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"code\":\"CSRF_INVALID\",\"message\":\"La solicitud de seguridad caducó. Vuelve a intentarlo.\"}");
    }
}
