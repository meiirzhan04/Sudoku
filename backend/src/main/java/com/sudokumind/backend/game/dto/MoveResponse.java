package com.sudokumind.backend.game.dto;

import com.sudokumind.backend.common.enums.GameStatus;

public record MoveResponse(
        boolean correct,
        int[][] currentBoard,
        int mistakes,
        int progressPercent,
        GameStatus status
) {
}
