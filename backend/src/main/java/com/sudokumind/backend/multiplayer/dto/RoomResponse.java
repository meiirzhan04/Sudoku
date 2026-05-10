package com.sudokumind.backend.multiplayer.dto;

import com.sudokumind.backend.common.enums.RoomStatus;

import java.util.List;
import java.util.UUID;

public record RoomResponse(
        UUID id,
        String roomCode,
        RoomStatus status,
        UUID winnerUserId,
        int[][] puzzle,
        List<RoomPlayerResponse> players
) {
}
