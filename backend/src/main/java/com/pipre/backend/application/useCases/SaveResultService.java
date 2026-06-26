package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.SaveResultCommand;
import com.pipre.backend.application.ports.input.SaveResultUseCase;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.result.Result;
import com.pipre.backend.domain.factories.ResultFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SaveResultService implements SaveResultUseCase {
    private final ResultRepositoryPort resultRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;

    private String resolveUserId(String idOrEmail) {
        if (idOrEmail != null && idOrEmail.contains("@")) {
            return userRepositoryPort.findByEmail(idOrEmail)
                    .map(u -> u.getIdUser())
                    .orElse(idOrEmail);
        }
        return idOrEmail;
    }

    @Override
    public String execute(SaveResultCommand command) {
        String resolvedId = resolveUserId(command.idStudent());
        Result result = ResultFactory.createNewResult(
                resolvedId,
                command.idActivity(),
                command.attempts(),
                command.score()
        );
        resultRepositoryPort.save(result);
        return result.getIdResult();
    }
}
