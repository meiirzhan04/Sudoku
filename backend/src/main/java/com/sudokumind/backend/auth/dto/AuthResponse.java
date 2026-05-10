package com.sudokumind.backend.auth.dto;

import com.sudokumind.backend.user.dto.UserResponse;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {
}
