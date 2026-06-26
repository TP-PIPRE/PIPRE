package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.AchievementDTO;
import java.util.List;

public interface GetStudentAchievementsUseCase {
    List<AchievementDTO> execute(String idStudent);
}
