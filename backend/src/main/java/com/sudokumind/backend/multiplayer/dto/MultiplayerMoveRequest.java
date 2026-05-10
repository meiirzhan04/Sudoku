package com.sudokumind.backend.multiplayer.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.UUID;

public record MultiplayerMoveRequest(
        UUID roomId,
        @Min(0) @Max(8) int row,
        @Min(0) @Max(8) int col,
        @Min(0) @Max(9) int value
) {
}
