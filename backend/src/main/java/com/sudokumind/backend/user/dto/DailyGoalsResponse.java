package com.sudokumind.backend.user.dto;

import java.util.List;

public record DailyGoalsResponse(List<DailyGoalResponse> goals) {
}
