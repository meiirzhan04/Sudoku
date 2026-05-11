package com.sudokumind.backend.user.dto;

public record DailyGoalResponse(
        String id,
        String title,
        int xp,
        boolean completed
) {
}
