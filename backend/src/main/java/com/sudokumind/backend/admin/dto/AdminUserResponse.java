package com.sudokumind.backend.admin.dto;

import com.sudokumind.backend.common.enums.UserRole;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String fullName,
        String username,
        String email,
        String city,
        UserRole role,
        boolean emailVerified,
        long gamesPlayed,
        long wins,
        Integer bestTimeSeconds,
        BigDecimal averageAccuracy,
        int currentStreak,
        int xp,
        Integer xpOverride,
        Integer streakOverride,
        Instant createdAt,
        Instant updatedAt
) {
}
