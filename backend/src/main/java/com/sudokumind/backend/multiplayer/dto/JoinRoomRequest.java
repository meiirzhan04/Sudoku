package com.sudokumind.backend.multiplayer.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinRoomRequest(@NotBlank String roomCode) {
}
