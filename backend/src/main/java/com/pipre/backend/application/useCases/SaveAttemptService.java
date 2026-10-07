package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.SaveAttemptCommand;
import com.pipre.backend.application.ports.input.SaveAttemptUseCase;
import com.pipre.backend.application.ports.output.SaveTelemetryPort;
import com.pipre.backend.domain.entities.telemetry.TelemetryAttempt;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.factories.TelemetryAttemptFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
public class SaveAttemptService implements SaveAttemptUseCase {
    private final SaveTelemetryPort saveTelemetryPort;

    private LocalDateTime parseCompletedAt(String completedAt) {
        try {
            return LocalDateTime.ofInstant(Instant.parse(completedAt), ZoneOffset.UTC);
        } catch (DateTimeParseException e) {
            throw new BusinessException("El formato de completedAt no es válido.");
        }
    }

    @Override
    public void execute(SaveAttemptCommand command) {
        TelemetryAttempt attempt = TelemetryAttemptFactory.createNewAttempt(
                command.studentId(),
                command.game(),
                command.result(),
                command.tiempoResolucion(),
                command.movimientos(),
                command.reinicios(),
                command.pistasIa(),
                parseCompletedAt(command.completedAt())
        );
        saveTelemetryPort.save(attempt);
    }
}
