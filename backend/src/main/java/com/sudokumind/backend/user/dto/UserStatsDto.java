package com.sudokumind.backend.user.dto;

import java.math.BigDecimal;

public record UserStatsDto(
        long gamesPlayed,
        long wins,
        Integer bestTimeSeconds,
        BigDecimal averageAccuracy,
        int bestStreak,
        long friendsCount
) {
}
