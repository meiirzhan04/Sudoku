package com.sudokumind.backend.game.sudoku;

import com.sudokumind.backend.common.enums.Difficulty;

public record SudokuPuzzle(
        int[][] puzzle,
        int[][] solution,
        Difficulty difficulty,
        String seed
) {
}
