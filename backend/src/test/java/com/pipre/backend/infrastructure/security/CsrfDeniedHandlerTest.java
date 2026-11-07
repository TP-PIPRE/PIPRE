package com.pipre.backend.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.csrf.*;
import static org.junit.jupiter.api.Assertions.*;

class CsrfDeniedHandlerTest {
    @Test void csrfRejectionHasASpecificRenewableCode()throws Exception {
        var response=new MockHttpServletResponse();
        new CsrfDeniedHandler().handle(new MockHttpServletRequest(),response,new InvalidCsrfTokenException(new DefaultCsrfToken("header","parameter","expected"),"invalid"));
        assertEquals(403,response.getStatus());assertTrue(response.getContentAsString().contains("\"code\":\"CSRF_INVALID\""));
    }
    @Test void permissionDenialCannotBeMistakenForARetryableCsrfFailure()throws Exception {
        var response=new MockHttpServletResponse();
        new CsrfDeniedHandler().handle(new MockHttpServletRequest(),response,new AccessDeniedException("Permission denied"));
        assertEquals(403,response.getStatus());assertFalse(response.getContentAsString().contains("CSRF_INVALID"));
    }
}
