package com.sudokumind.backend.auth.dto;

import java.util.UUID;

public record RegisterResponse(
        String message,
        UUID userId
) {
}
