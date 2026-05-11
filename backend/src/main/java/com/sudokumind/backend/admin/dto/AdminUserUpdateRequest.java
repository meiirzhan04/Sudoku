package com.sudokumind.backend.admin.dto;

import com.sudokumind.backend.common.enums.UserRole;

public record AdminUserUpdateRequest(
        String fullName,
        String username,
        String city,
        UserRole role,
        Boolean emailVerified,
        Integer xpOverride,
        Integer streakOverride
) {
}
