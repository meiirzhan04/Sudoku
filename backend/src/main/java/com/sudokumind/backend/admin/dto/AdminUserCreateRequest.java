package com.sudokumind.backend.admin.dto;

import com.sudokumind.backend.common.enums.UserRole;

public record AdminUserCreateRequest(
        String fullName,
        String username,
        String email,
        String password,
        String city,
        UserRole role,
        Boolean emailVerified,
        Integer xpOverride,
        Integer streakOverride
) {
}
