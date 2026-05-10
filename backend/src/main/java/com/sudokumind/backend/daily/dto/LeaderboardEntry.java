package com.sudokumind.backend.daily.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record LeaderboardEntry(
        int rank,
        UUID userId,
        String username,
        String city,
        String avatarUrl,
        int timeSeconds,
        int mistakes,
        BigDecimal accuracy,
        boolean isPro
) {
}
