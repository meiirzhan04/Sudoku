package com.sudokumind.backend.game.dto;

import com.sudokumind.backend.common.enums.Difficulty;
import com.sudokumind.backend.common.enums.GameStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GameSessionResponse(
        UUID id,
        int[][] puzzle,
        int[][] solution,
        int[][] currentBoard,
        Difficulty difficulty,
        GameStatus status,
        int mistakes,
        int hintsUsed,
        int elapsedSeconds,
        BigDecimal accuracy,
        boolean daily,
        Instant createdAt,
        Instant completedAt
) {
}
