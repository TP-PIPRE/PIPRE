package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.DropoutRiskDTO;
import com.pipre.backend.application.ports.input.GetDropoutRiskUseCase;
import com.pipre.backend.application.ports.output.DropoutRiskRepositoryPort;
import com.pipre.backend.domain.entities.dropoutrisk.DropoutRisk;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetDropoutRiskService implements GetDropoutRiskUseCase {

    private final DropoutRiskRepositoryPort dropoutRiskRepositoryPort;

    @Override
    public DropoutRiskDTO execute(String idStudent) {
        DropoutRisk dr = dropoutRiskRepositoryPort.findByIdStudent(idStudent)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró análisis de riesgo de deserción para el alumno: " + idStudent));

        return new DropoutRiskDTO(
                dr.getIdRisk(),
                dr.getDaysInactive(),
                dr.getPerformance(),
                dr.getRiskLevel(),
                dr.getMotivationLevel(),
                dr.getAnalysisDate(),
                dr.getIdStudent()
        );
    }
}
