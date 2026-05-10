package com.sudokumind.backend.game.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SaveGameRequest(
        @NotNull int[][] currentBoard,
        @Min(0) int mistakes,
        @Min(0) int elapsedSeconds,
        @Min(0) int hintsUsed
) {
}
