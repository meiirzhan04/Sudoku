package com.sudokumind.backend.multiplayer.dto;

import com.sudokumind.backend.common.enums.RoomStatus;

import java.util.UUID;

public record CreateRoomResponse(
        UUID roomId,
        String roomCode,
        RoomStatus status,
        int[][] puzzle
) {
}
