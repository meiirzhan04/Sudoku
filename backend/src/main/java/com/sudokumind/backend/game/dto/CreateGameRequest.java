package com.sudokumind.backend.game.dto;

import com.sudokumind.backend.common.enums.Difficulty;
import jakarta.validation.constraints.NotNull;

public record CreateGameRequest(@NotNull Difficulty difficulty) {
}
