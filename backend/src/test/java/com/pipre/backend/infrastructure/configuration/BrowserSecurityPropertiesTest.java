package com.pipre.backend.infrastructure.configuration;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class BrowserSecurityPropertiesTest {
    @Test void localCookieCanBeUsedOverHttpAndRemainsHttpOnly() {
        var properties = new BrowserSecurityProperties(); properties.validate();
        var cookie = properties.cookie("token", 3600);
        assertTrue(cookie.isHttpOnly()); assertFalse(cookie.isSecure()); assertEquals("Lax", cookie.getSameSite());
    }
    @Test void loginAndLogoutShareProductionCookieAttributes() {
        var properties = new BrowserSecurityProperties(); properties.setCookieSecure(true); properties.setCookieSameSite("None"); properties.validate();
        var login = properties.cookie("token", 3600); var logout = properties.cookie("", 0);
        assertTrue(login.isSecure()); assertTrue(logout.isSecure()); assertEquals(login.getPath(), logout.getPath());
        assertEquals(login.getSameSite(), logout.getSameSite()); assertEquals(0, logout.getMaxAge().getSeconds());
    }
    @Test void noneRequiresSecure() {
        var properties = new BrowserSecurityProperties(); properties.setCookieSameSite("None");
        assertThrows(IllegalArgumentException.class, properties::validate);
    }
    @Test void corsRejectsWildcardsAndUrlsWithPaths() {
        var properties = new BrowserSecurityProperties(); properties.setAllowedOrigins(List.of("*"));
        assertThrows(IllegalArgumentException.class, properties::validate);
        properties.setAllowedOrigins(List.of("https://example.com/path"));
        assertThrows(IllegalArgumentException.class, properties::validate);
        properties.setAllowedOrigins(List.of("https://example.com")); assertDoesNotThrow(properties::validate);
    }
}
