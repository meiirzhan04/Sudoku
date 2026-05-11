package com.sudokumind.backend.multiplayer.dto;

import com.sudokumind.backend.common.enums.InviteStatus;

import java.time.Instant;
import java.util.UUID;

public record GameInviteResponse(
        UUID id,
        UUID senderId,
        String senderUsername,
        UUID receiverId,
        String receiverUsername,
        UUID roomId,
        String roomCode,
        InviteStatus status,
        Instant expiresAt
) {
}
