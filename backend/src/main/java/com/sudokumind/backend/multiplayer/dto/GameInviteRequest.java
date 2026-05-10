package com.sudokumind.backend.multiplayer.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GameInviteRequest(@NotNull UUID friendId) {
}
