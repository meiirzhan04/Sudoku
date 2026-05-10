package com.sudokumind.backend.daily.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public record DailySubmitRequest(
        @Min(0) int timeSeconds,
        @Min(0) int mistakes,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal accuracy
) {
}
