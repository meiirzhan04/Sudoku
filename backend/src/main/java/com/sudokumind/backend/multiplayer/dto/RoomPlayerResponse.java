package com.sudokumind.backend.multiplayer.dto;

import java.time.Instant;
import java.util.UUID;

public record RoomPlayerResponse(
        UUID userId,
        String username,
        String avatarUrl,
        int mistakes,
        int elapsedSeconds,
        int progressPercent,
        boolean connected,
        Instant finishedAt
) {
}
