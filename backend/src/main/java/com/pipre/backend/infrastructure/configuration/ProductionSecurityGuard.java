package com.pipre.backend.infrastructure.configuration;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.core.env.Environment;
import jakarta.annotation.PostConstruct;

/** Fail before serving requests if production inherited local bootstrap or credentials. */
@Component
@Profile("production")
public class ProductionSecurityGuard {
    private final Environment environment;
    private final BrowserSecurityProperties browser;
    public ProductionSecurityGuard(Environment environment,BrowserSecurityProperties browser){this.environment=environment;this.browser=browser;}
    @PostConstruct public void validate() {
        for(String property:new String[]{"jwt.secret","spring.datasource.url","spring.datasource.username","spring.datasource.password"}) {
            String value=environment.getRequiredProperty(property);
            if(value.isBlank()||value.contains("${")||value.contains("clave_secreta_segura_desarrollo")||value.equals("pipre_password"))throw new IllegalStateException("Producción requiere configurar "+property);
        }
        if(environment.getRequiredProperty("jwt.secret").length()<32)throw new IllegalStateException("JWT_SECRET requiere al menos 32 caracteres.");
        if(environment.getProperty("pipre.seed.access-users",Boolean.class,true)||environment.getProperty("pipre.seed.demo-data",Boolean.class,false))throw new IllegalStateException("Producción no permite cuentas o datos de demostración.");
        if(!browser.isCookieSecure()||browser.getAllowedOrigins().stream().anyMatch(origin->!origin.startsWith("https://")))throw new IllegalStateException("Producción requiere cookies seguras y orígenes HTTPS explícitos.");
    }
}
