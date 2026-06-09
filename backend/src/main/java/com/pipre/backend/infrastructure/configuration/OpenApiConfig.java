package com.pipre.backend.infrastructure.configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(title = "PIPRE API", description = "Documentación de endpoints"))
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

    @Bean
    public OpenApiCustomizer globalResponsesOpenApiCustomizer() {
        return openApi -> openApi.getPaths().values()
                .forEach(pathItem -> pathItem.readOperations().forEach(operation -> {
                    ApiResponses apiResponses = operation.getResponses();

                    if (!apiResponses.containsKey("400")) {
                        apiResponses.addApiResponse("400", new ApiResponse()
                                .description("Datos de entrada inválidos / Petición incorrecta"));
                    }
                    if (!apiResponses.containsKey("403")) {
                        apiResponses.addApiResponse("403", new ApiResponse()
                                .description("Acceso denegado / No autorizado"));
                    }
                    if (!apiResponses.containsKey("404")) {
                        apiResponses.addApiResponse("404", new ApiResponse()
                                .description("Recurso no encontrado"));
                    }
                    if (!apiResponses.containsKey("500")) {
                        apiResponses.addApiResponse("500", new ApiResponse()
                                .description("Error interno del servidor"));
                    }
                }));
    }
}
