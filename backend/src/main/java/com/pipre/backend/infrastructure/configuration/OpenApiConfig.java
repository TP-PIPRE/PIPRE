package com.pipre.backend.infrastructure.configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "PIPRE API",
                description = "Documentación de endpoints"
        ),
        servers = {
                @Server(
                        url = "https://pipre-backend.yoshua-cloud.dedyn.io",
                        description = "Servidor de Producción (OCI)"
                ),

                @Server(
                        url = "https://dev-back.yoshua-cloud.dedyn.io",
                        description = "Entorno de Desarrollo en la nube"
                ),

                @Server(
                        url = "http://localhost:8080",
                        description = "Entorno de Desarrollo Local"
                )
        }
)
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .addSecurityItem(new SecurityRequirement()
                        .addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
