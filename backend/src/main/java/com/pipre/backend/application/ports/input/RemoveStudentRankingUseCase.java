package com.pipre.backend.application.ports.input;

public interface RemoveStudentRankingUseCase {
    void execute(String idGroup, String idStudent);
}
