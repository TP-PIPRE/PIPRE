package com.pipre.backend.adapters.in.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.pipre.backend.application.ports.output.EducationalMetricsPort;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.infrastructure.security.AcademicAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/educational-metrics")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@RequiredArgsConstructor
public class EducationalMetricsController {
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private final EducationalMetricsPort metrics;
    private final AcademicAccessPolicy access;
    private final Clock clock;

    @GetMapping("/options")
    public JsonNode options() {
        return metrics.options(scope());
    }

    @GetMapping
    public JsonNode report(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "") String group, @RequestParam(defaultValue = "") String grade,
            @RequestParam(defaultValue = "") String game, @RequestParam(defaultValue = "") String student) {
        LocalDate end = to == null ? LocalDate.now(clock.withZone(LIMA)) : to;
        LocalDate start = from == null ? end.minusDays(29) : from;
        if (start.getYear() < 1 || end.getYear() > 9999 || start.isAfter(end)) {
            throw new BusinessException("El periodo debe tener fechas válidas y ordenadas.");
        }
        if (!Set.of("", "neonflow", "tetrilogic").contains(game)) {
            throw new BusinessException("Selecciona un curso válido.");
        }
        return metrics.report(scope(), new EducationalMetricsPort.Filter(start, end, group, grade, game, student));
    }

    private EducationalMetricsPort.Scope scope() {
        String actor = access.currentId();
        if (actor == null) throw new AccessDeniedException("No tienes acceso a las métricas educativas.");
        return new EducationalMetricsPort.Scope(actor, access.role("ADMIN"));
    }
}
