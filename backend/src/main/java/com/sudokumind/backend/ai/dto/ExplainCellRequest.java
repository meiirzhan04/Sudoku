package com.sudokumind.backend.ai.dto;

import com.sudokumind.backend.common.enums.Language;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ExplainCellRequest(
        UUID gameSessionId,
        @Min(0) @Max(8) int row,
        @Min(0) @Max(8) int col,
        @NotNull int[][] currentBoard,
        @NotNull Language language
) {
}
