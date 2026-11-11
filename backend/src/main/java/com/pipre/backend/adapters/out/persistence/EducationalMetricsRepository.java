package com.pipre.backend.adapters.out.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.ports.output.EducationalMetricsPort;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

@Repository
public class EducationalMetricsRepository implements EducationalMetricsPort {
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper json;
    private final String optionsQuery;
    private final String reportQuery;

    public EducationalMetricsRepository(NamedParameterJdbcTemplate jdbc, ObjectMapper json) throws IOException {
        this.jdbc = jdbc;
        this.json = json;
        String scope = sql("scope");
        optionsQuery = scope + "\n" + sql("options");
        reportQuery = scope + "\n" + sql("report");
    }

    @Override
    public JsonNode options(Scope scope) {
        return query(optionsQuery, parameters(scope));
    }

    @Override
    public JsonNode report(Scope scope, Filter filter) {
        var params = parameters(scope)
                .addValue("fromDay", filter.from())
                .addValue("toDay", filter.to())
                .addValue("startAt", filter.from().atStartOfDay(LIMA).toOffsetDateTime())
                .addValue("endAt", filter.to().plusDays(1).atStartOfDay(LIMA).toOffsetDateTime())
                .addValue("bucket", ChronoUnit.DAYS.between(filter.from(), filter.to()) < 45 ? "day" : "week")
                .addValue("group", filter.group()).addValue("grade", filter.grade())
                .addValue("game", filter.game()).addValue("student", filter.student());
        var result = query(reportQuery, params);
        if (!result.path("allowed").asBoolean()) throw new AccessDeniedException("El aula o estudiante no está en tu alcance.");
        return result.path("report");
    }

    private JsonNode query(String sql, MapSqlParameterSource params) {
        try {
            return json.readTree(jdbc.queryForObject(sql, params, String.class));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("El informe de métricas contiene datos inválidos.", exception);
        }
    }

    private static MapSqlParameterSource parameters(Scope scope) {
        return new MapSqlParameterSource().addValue("actor", scope.actor()).addValue("admin", scope.admin());
    }

    private static String sql(String name) throws IOException {
        return new ClassPathResource("metrics/" + name + ".sql").getContentAsString(StandardCharsets.UTF_8);
    }
}
