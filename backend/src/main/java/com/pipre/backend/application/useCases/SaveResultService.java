package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.SaveResultCommand;
import com.pipre.backend.application.ports.input.SaveResultUseCase;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.result.Result;
import com.pipre.backend.domain.factories.ResultFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SaveResultService implements SaveResultUseCase {
    private final ResultRepositoryPort resultRepositoryPort;

    @Override
    public String execute(SaveResultCommand command) {
        Result result = ResultFactory.createNewResult(
                command.idStudent(),
                command.idActivity(),
                command.attempts(),
                command.score()
        );
        resultRepositoryPort.save(result);
        return result.getIdResult();
    }
}
