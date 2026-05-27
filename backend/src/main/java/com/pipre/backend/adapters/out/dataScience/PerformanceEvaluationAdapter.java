package com.pipre.backend.adapters.out.dataScience;

import com.pipre.backend.adapters.in.web.dto.RIA01RequestDTO;
import com.pipre.backend.adapters.in.web.dto.RIA01ResponseDTO;
import com.pipre.backend.application.ports.output.PerformanceEvaluationPort;
import com.pipre.backend.domain.Prediction;
import com.pipre.backend.domain.entities.Activity;
import com.pipre.backend.domain.entities.Result;
import com.pipre.backend.domain.entities.HelpRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class PerformanceEvaluationAdapter implements PerformanceEvaluationPort {

    private final RestClient restClient;

    @Override
    public Prediction getEvaluation(
            Activity activity,
            HelpRequest helpRequest,
            Result result
    ) {
        RIA01RequestDTO requestDTO = new RIA01RequestDTO(
                // acumular intentos entre todos los resultados de la actividad
                result.getAttempts(),
                // acumular errores entre todos los resultados de la actividad
                result.getErrors(),
                //dejar
                activity.getLogicLevel(),
                // relacionar interacción de ia con actividad
                helpRequest.getAiInteractions().floatValue()
        );

        RIA01ResponseDTO responseDTO = restClient.post()
                .uri("/ria01/predict")
                .body(requestDTO)
                .retrieve()
                .body(RIA01ResponseDTO.class);

        if(responseDTO == null) {
            throw new RuntimeException("No se recibió respuesta de FastAPI");
        }

        return new Prediction(
                responseDTO.result(),
                responseDTO.accuracy(),
                responseDTO.precision(),
                null);
    }
}
