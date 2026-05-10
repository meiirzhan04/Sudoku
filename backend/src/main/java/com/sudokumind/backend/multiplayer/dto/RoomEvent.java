package com.sudokumind.backend.multiplayer.dto;

import java.util.UUID;

public record RoomEvent(
        String type,
        UUID userId,
        String username,
        int row,
        int col,
        int value,
        boolean correct,
        int progressPercent,
        int mistakes
) {
}
