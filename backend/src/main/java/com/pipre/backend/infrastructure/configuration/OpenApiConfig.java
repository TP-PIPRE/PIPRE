package com.pipre.backend.infrastructure.configuration;

import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.pipre.backend.adapters.in.web.dto.ApiErrorResponse;

@Configuration
@OpenAPIDefinition(info = @Info(title = "PIPRE API", description = "Documentación de endpoints"))
public class OpenApiConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "cookieAuth";
        OpenAPI openAPI = new OpenAPI()
                .addSecurityItem(new SecurityRequirement()
                        .addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name("jwt")
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.COOKIE)));

        // Registrar el esquema de ApiErrorResponse manualmente para que aparezca en OpenAPI Components
        ModelConverters.getInstance()
                .read(ApiErrorResponse.class)
                .forEach((key, value) -> openAPI.getComponents().addSchemas(key, value));

        return openAPI;
    }

    @Bean
    public OpenApiCustomizer globalResponsesOpenApiCustomizer() {
        return openApi -> openApi.getPaths().values()
                .forEach(pathItem -> pathItem.readOperations().forEach(operation -> {
                    ApiResponses apiResponses = operation.getResponses();

                    Schema<?> errorSchema = new Schema<>().$ref("#/components/schemas/ApiErrorResponse");
                    Content content = new Content().addMediaType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE,
                            new MediaType().schema(errorSchema));

                    setupGlobalResponse(apiResponses, "400", "Datos de entrada inválidos / Petición incorrecta", content);
                    setupGlobalResponse(apiResponses, "401", "Credenciales incorrectas / No autenticado", content);
                    setupGlobalResponse(apiResponses, "403", "Acceso denegado / No autorizado", content);
                    setupGlobalResponse(apiResponses, "404", "Recurso no encontrado", content);
                    setupGlobalResponse(apiResponses, "500", "Error interno del servidor", content);
                }));
    }

    private void setupGlobalResponse(ApiResponses apiResponses, String code, String description, Content content) {
        if (!apiResponses.containsKey(code)) {
            apiResponses.addApiResponse(code, new ApiResponse()
                    .description(description)
                    .content(content));
        } else {
            ApiResponse existing = apiResponses.get(code);
            if (existing.getContent() == null || existing.getContent().isEmpty()) {
                existing.setContent(content);
            }
        }
    }
}
