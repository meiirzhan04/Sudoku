package com.sudokumind.backend.friends.dto;

import com.sudokumind.backend.common.enums.FriendRequestStatus;
import com.sudokumind.backend.user.dto.PublicUserResponse;

import java.time.Instant;
import java.util.UUID;

public record FriendRequestResponse(
        UUID id,
        PublicUserResponse sender,
        PublicUserResponse receiver,
        FriendRequestStatus status,
        Instant createdAt
) {
}
