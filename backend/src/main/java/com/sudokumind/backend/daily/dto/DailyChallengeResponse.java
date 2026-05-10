package com.sudokumind.backend.daily.dto;

import com.sudokumind.backend.common.enums.Difficulty;

import java.time.LocalDate;
import java.util.UUID;

public record DailyChallengeResponse(
        UUID id,
        LocalDate challengeDate,
        int[][] puzzle,
        Difficulty difficulty
) {
}
