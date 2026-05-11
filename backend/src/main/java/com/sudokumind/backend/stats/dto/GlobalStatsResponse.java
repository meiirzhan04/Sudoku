package com.sudokumind.backend.stats.dto;

public record GlobalStatsResponse(
        long players,
        long gamesToday,
        long online
) {
}
