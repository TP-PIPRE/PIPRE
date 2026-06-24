package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.RatingRequestDTO;
import com.pipre.backend.adapters.in.web.dto.RatingResponseDTO;
import com.pipre.backend.application.ports.input.RatePerformanceUseCase;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.result.Result;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class RatePerformanceService implements RatePerformanceUseCase {

    private final ResultRepositoryPort resultRepositoryPort;

    @Override
    public RatingResponseDTO execute(RatingRequestDTO request) {
        Result result = resultRepositoryPort.findById(request.idResult())
                .orElseThrow(() -> new ResourceNotFoundException("Resultado no encontrado con el ID: " + request.idResult()));

        // Calcular accuracy (precisión de acierto basada en el puntaje de 0 a 10)
        BigDecimal score = result.getScore();
        BigDecimal accuracy = (score != null)
                ? score.divide(BigDecimal.valueOf(10.0), 2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(0.85);

        if (accuracy.compareTo(BigDecimal.ONE) > 0) {
            accuracy = BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP);
        } else if (accuracy.compareTo(BigDecimal.ZERO) < 0) {
            accuracy = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        // Calcular precision (precisión basada en la cantidad de errores cometidos)
        Integer errors = result.getErrors();
        BigDecimal precisionVal = BigDecimal.valueOf(0.90);
        if (errors != null) {
            precisionVal = BigDecimal.valueOf(1.0).subtract(BigDecimal.valueOf(errors).multiply(BigDecimal.valueOf(0.1)));
            if (precisionVal.compareTo(BigDecimal.ZERO) < 0) {
                precisionVal = BigDecimal.ZERO;
            }
        }
        precisionVal = precisionVal.setScale(2, RoundingMode.HALF_UP);

        String simResult = result.getResultSimulation() != null ? result.getResultSimulation() : "SUCCESS";

        return new RatingResponseDTO(simResult, accuracy, precisionVal);
    }
}
