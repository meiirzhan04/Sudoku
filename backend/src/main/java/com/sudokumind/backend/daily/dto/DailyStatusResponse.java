package com.sudokumind.backend.daily.dto;

import java.util.UUID;

public record DailyStatusResponse(
        UUID challengeId,
        boolean completed,
        Integer timeSeconds,
        Integer mistakes,
        Integer accuracy,
        int rank
) {
}
