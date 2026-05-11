package com.sudokumind.backend.multiplayer.dto;

import com.sudokumind.backend.common.enums.Difficulty;

public record CreateBattleRoomRequest(
        Difficulty difficulty,
        String mode
) {
}
