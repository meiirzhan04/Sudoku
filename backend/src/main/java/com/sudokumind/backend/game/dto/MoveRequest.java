package com.sudokumind.backend.game.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record MoveRequest(
        @Min(0) @Max(8) int row,
        @Min(0) @Max(8) int col,
        @Min(0) @Max(9) int value
) {
}
