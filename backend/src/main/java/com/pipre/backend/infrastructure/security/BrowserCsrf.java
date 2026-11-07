package com.pipre.backend.infrastructure.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.csrf.CsrfFilter;
import java.util.Arrays;

/** Bearer-only clients are stateless; browser and cookie-authenticated writes require a token. */
public final class BrowserCsrf {
    private BrowserCsrf() {}
    public static boolean required(HttpServletRequest request) {
        if(!CsrfFilter.DEFAULT_CSRF_MATCHER.matches(request))return false;
        return request.getHeader("Origin")!=null||request.getHeader("Sec-Fetch-Site")!=null
            ||request.getCookies()!=null&&Arrays.stream(request.getCookies()).anyMatch(cookie->cookie.getName().equals("jwt"));
    }
}
