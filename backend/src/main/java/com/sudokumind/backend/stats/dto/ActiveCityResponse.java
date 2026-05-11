package com.sudokumind.backend.stats.dto;

public record ActiveCityResponse(
        String flag,
        String city,
        long count
) {
}
