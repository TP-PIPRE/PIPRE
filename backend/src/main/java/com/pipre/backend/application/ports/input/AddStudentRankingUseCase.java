package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.AddStudentRankingCommand;

public interface AddStudentRankingUseCase {
    void execute(AddStudentRankingCommand command);
}
