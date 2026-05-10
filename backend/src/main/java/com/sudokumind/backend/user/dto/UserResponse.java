package com.sudokumind.backend.user.dto;

import com.sudokumind.backend.common.enums.Language;
import com.sudokumind.backend.common.enums.UserRole;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String username,
        String email,
        String city,
        String avatarUrl,
        Language language,
        UserRole role,
        boolean emailVerified,
        UserStatsDto stats
) {
}
