package com.sudokumind.backend.friends.dto;

import com.sudokumind.backend.user.dto.PublicUserResponse;

import java.time.Instant;

public record FriendResponse(
        PublicUserResponse user,
        boolean online,
        Instant friendsSince
) {
}
