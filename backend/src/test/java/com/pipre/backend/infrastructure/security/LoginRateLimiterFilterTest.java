package com.pipre.backend.infrastructure.security;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class LoginRateLimiterFilterTest {
    MockHttpServletRequest request(String remote,String forwarded){var request=new MockHttpServletRequest("POST","/api/v1/auth/login");request.setRemoteAddr(remote);request.addHeader("X-Forwarded-For",forwarded);return request;}
    @Test void ignoresForgedForwardingHeadersByDefault(){var filter=new LoginRateLimiterFilter(mock(LoginAttemptLimiter.class),"");assertEquals("192.0.2.9",filter.clientAddress(request("192.0.2.9","198.51.100.7")));}
    @Test void usesRightmostUntrustedHop(){var filter=new LoginRateLimiterFilter(mock(LoginAttemptLimiter.class),"10.0.0.0/8");assertEquals("192.0.2.9",filter.clientAddress(request("10.0.0.2","198.51.100.7,192.0.2.9,10.0.0.3")));}
    @Test void invalidHostnamesDoNotTriggerDnsLookups(){var filter=new LoginRateLimiterFilter(mock(LoginAttemptLimiter.class),"10.0.0.0/8");assertEquals("10.0.0.2",filter.clientAddress(request("10.0.0.2","attacker.invalid")));}
    @Test void rejectsHexadecimalHostnamesAndOutOfRangeIpv4(){var filter=new LoginRateLimiterFilter(mock(LoginAttemptLimiter.class),"10.0.0.0/8");for(String invalid:new String[]{"deadbeef","2130706433","192.0.2.999"})assertEquals("10.0.0.2",filter.clientAddress(request("10.0.0.2",invalid)));assertThrows(IllegalArgumentException.class,()->new LoginRateLimiterFilter(mock(LoginAttemptLimiter.class),"deadbeef"));}
    @Test void canonicalizesEquivalentLiteralAddresses(){var filter=new LoginRateLimiterFilter(mock(LoginAttemptLimiter.class),"10.0.0.0/8");assertEquals("192.0.2.9",filter.clientAddress(request("10.0.0.2","::ffff:192.0.2.9")));}
    @Test void limitReturns429AndRetryAfterWithoutReachingAuthentication()throws Exception{var limiter=mock(LoginAttemptLimiter.class);when(limiter.retryAfter("192.0.2.9")).thenReturn(42);var response=new MockHttpServletResponse();var chain=new MockFilterChain();new LoginRateLimiterFilter(limiter,"").doFilter(request("192.0.2.9","fake"),response,chain);assertEquals(429,response.getStatus());assertEquals("42",response.getHeader("Retry-After"));assertNull(chain.getRequest());}
}
