package com.sudokumind.backend.leaderboard;

import java.math.BigDecimal;
import java.util.UUID;

public record GlobalLeaderboardEntry(
        int rank,
        UUID userId,
        String username,
        String city,
        String avatarUrl,
        long completedGames,
        Integer bestTimeSeconds,
        BigDecimal averageAccuracy,
        String tier,
        boolean pro
) {
}
