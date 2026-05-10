package com.sudokumind.backend.friends.dto;

import jakarta.validation.constraints.NotBlank;

public record FriendRequestCreateRequest(@NotBlank String receiverUsername) {
}
