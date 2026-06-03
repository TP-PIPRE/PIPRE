package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.ResultRequestDTO;
import com.pipre.backend.application.ports.input.SaveResultUseCase;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.Result;
import com.pipre.backend.domain.factories.ResultFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SaveResultService implements SaveResultUseCase {
    private final ResultRepositoryPort resultRepositoryPort;

    @Override
    public String execute(ResultRequestDTO requestDTO) {
        Result result = ResultFactory.createNewResult(
                requestDTO.idStudent(),
                requestDTO.idActivity(),
                requestDTO.attempts(),
                requestDTO.score()
        );
        resultRepositoryPort.save(result);
        return result.getIdResult();
    }
}
