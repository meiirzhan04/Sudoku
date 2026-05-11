package com.sudokumind.backend.stats.dto;

import java.util.UUID;

public record OnlinePlayerResponse(
        UUID id,
        String username,
        String city,
        String avatarUrl,
        String status
) {
}
