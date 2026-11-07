package com.pipre.backend.infrastructure.configuration;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
class ProductionSecurityGuardTest {
    MockEnvironment environment(){return new MockEnvironment().withProperty("jwt.secret","a-production-secret-with-at-least-32-characters").withProperty("spring.datasource.url","jdbc:postgresql://db/app").withProperty("spring.datasource.username","app").withProperty("spring.datasource.password","operator-supplied").withProperty("pipre.seed.access-users","false").withProperty("pipre.seed.demo-data","false");}
    BrowserSecurityProperties browser(){var browser=new BrowserSecurityProperties();browser.setCookieSecure(true);browser.setAllowedOrigins(List.of("https://pipre.example"));return browser;}
    @Test void requiresExplicitProductionValues(){assertDoesNotThrow(()->new ProductionSecurityGuard(environment(),browser()).validate());}
    @Test void rejectsDemoBootstrap(){assertThrows(IllegalStateException.class,()->new ProductionSecurityGuard(environment().withProperty("pipre.seed.access-users","true"),browser()).validate());}
    @Test void rejectsLocalSecret(){assertThrows(IllegalStateException.class,()->new ProductionSecurityGuard(environment().withProperty("jwt.secret","clave_secreta_segura_desarrollo"),browser()).validate());}
    @Test void rejectsHttpOrigins(){var browser=browser();browser.setAllowedOrigins(List.of("http://localhost:5173"));assertThrows(IllegalStateException.class,()->new ProductionSecurityGuard(environment(),browser).validate());}
}
