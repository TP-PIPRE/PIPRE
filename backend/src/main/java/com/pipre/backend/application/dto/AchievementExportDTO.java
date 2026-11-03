package com.pipre.backend.application.dto;

import java.util.List;

public record AchievementExportDTO(Period period, List<Entry> achievements, int unlockedTotal, int newInPeriod) {
    public record Period(String from, String to, String timeZone) {}
    public record Entry(String code, boolean unlocked, int binary, String unlockedAt,
            boolean unlockedInPeriod, int periodBinary) {}
}
