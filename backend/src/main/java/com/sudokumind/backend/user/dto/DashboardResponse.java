package com.sudokumind.backend.user.dto;

import java.util.List;

public record DashboardResponse(
        String fullName,
        String username,
        String city,
        long gamesPlayed,
        long completedGames,
        Integer bestTimeSeconds,
        int averageAccuracy,
        int currentStreak,
        int longestStreak,
        String lastPlayedDate,
        List<String> completedDailyDates,
        int xp,
        int level,
        int xpProgress,
        int xpNeeded,
        int xpLeft,
        int streakFreezes,
        boolean dailyGoalCompleted,
        String currentRank
) {
}
