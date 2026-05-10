package com.sudokumind.backend.ai.dto;

public record ExplainCellResponse(
        String response,
        int hintsUsed,
        boolean limitReached
) {
}
