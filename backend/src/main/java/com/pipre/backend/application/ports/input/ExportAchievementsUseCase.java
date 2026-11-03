package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.AchievementExportDTO;
import java.time.LocalDate;

public interface ExportAchievementsUseCase {
    AchievementExportDTO export(String studentId, LocalDate from, LocalDate to);
}
