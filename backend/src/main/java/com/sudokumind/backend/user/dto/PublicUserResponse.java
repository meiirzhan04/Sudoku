package com.sudokumind.backend.user.dto;

import com.sudokumind.backend.common.enums.UserRole;

import java.util.UUID;

public record PublicUserResponse(
        UUID id,
        String fullName,
        String username,
        String city,
        String avatarUrl,
        UserRole role,
        UserStatsDto stats
) {
}
