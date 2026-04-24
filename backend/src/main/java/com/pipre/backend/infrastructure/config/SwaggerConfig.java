package com.pipre.backend.infrastructure.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
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
                        url = "http://localhost:8080",
                        description = "Entorno de Desarrollo Local"
                )
        }
)
public class SwaggerConfig {
}
