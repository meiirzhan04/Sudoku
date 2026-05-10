package com.sudokumind.backend.multiplayer.dto;

import java.util.UUID;

public record ProgressRequest(
        UUID roomId,
        int[][] currentBoard,
        int elapsedSeconds,
        int mistakes
) {
}
