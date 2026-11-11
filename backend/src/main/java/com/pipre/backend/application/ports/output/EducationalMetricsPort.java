package com.pipre.backend.application.ports.output;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;

public interface EducationalMetricsPort {
    record Scope(String actor, boolean admin) {}
    record Filter(LocalDate from, LocalDate to, String group, String grade, String game, String student) {}

    JsonNode options(Scope scope);
    JsonNode report(Scope scope, Filter filter);
}
