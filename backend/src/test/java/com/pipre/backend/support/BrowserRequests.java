package com.pipre.backend.support;

import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.web.csrf.*;
import jakarta.servlet.http.Cookie;
import java.util.*;

/** Real masked double-submit tokens; leaves the application's filter repository unchanged. */
public final class BrowserRequests {
    private BrowserRequests() {}
    public static RequestPostProcessor csrf() {
        return request->{
            var repository=new CookieCsrfTokenRepository();
            var token=repository.generateToken(request);
            new XorCsrfTokenRequestAttributeHandler().handle(request,new MockHttpServletResponse(),()->token);
            var masked=(CsrfToken)request.getAttribute(CsrfToken.class.getName());
            var cookies=new ArrayList<Cookie>();if(request.getCookies()!=null)cookies.addAll(Arrays.asList(request.getCookies()));
            cookies.removeIf(cookie->cookie.getName().equals("XSRF-TOKEN"));cookies.add(new Cookie("XSRF-TOKEN",token.getToken()));
            request.setCookies(cookies.toArray(Cookie[]::new));request.addHeader(token.getHeaderName(),masked.getToken());return request;
        };
    }
}
