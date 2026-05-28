package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.RatingRequestDTO;
import com.pipre.backend.adapters.in.web.dto.RatingResponseDTO;
import com.pipre.backend.application.ports.input.RatingPerformanceUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.application.ports.output.HelpRequestRepositoryPort;
import com.pipre.backend.application.ports.output.PerformanceEvaluationPort;
import com.pipre.backend.domain.Prediction;
import com.pipre.backend.domain.entities.Activity;
import com.pipre.backend.domain.entities.Result;
import com.pipre.backend.domain.entities.HelpRequest;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RatingPerformanceService implements RatingPerformanceUseCase {

    private final PerformanceEvaluationPort performanceEvaluationPort;
    private final ActivityRepositoryPort activityRepositoryPort;
    private final ResultRepositoryPort resultRepositoryPort;
    private final HelpRequestRepositoryPort helpRequestRepositoryPort ;

    @Override
    @Transactional
    public RatingResponseDTO execute(RatingRequestDTO requestDTO) {
        Activity activity = activityRepositoryPort.findById(requestDTO.idActivity())
                .orElseThrow(() -> new BusinessException("La actividad no existe"));
        HelpRequest helpRequest = helpRequestRepositoryPort.findById(requestDTO.idHelpRequest())
                .orElseThrow(() -> new BusinessException("El pedido de ayuda no existe"));
        Result result = resultRepositoryPort.findById(requestDTO.idResult())
                .orElseThrow(() -> new BusinessException("El resultado no existe"));
        Prediction prediction = performanceEvaluationPort.getEvaluation(
                activity, helpRequest, result);
        return new RatingResponseDTO(
                prediction.result(),
                prediction.accuracy(),
                prediction.precision()
        );
    }
}
