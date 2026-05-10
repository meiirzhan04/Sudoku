package com.sudokumind.backend.game.sudoku;

import com.sudokumind.backend.common.enums.Difficulty;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;

@Component
public class SudokuEngine {
    private static final Map<Difficulty, Integer> REMOVALS = Map.of(
            Difficulty.EASY, 38,
            Difficulty.MEDIUM, 46,
            Difficulty.HARD, 52,
            Difficulty.EXPERT, 58
    );

    public SudokuPuzzle generate(Difficulty difficulty) {
        return generate(difficulty, difficulty.name() + "-" + UUID.randomUUID());
    }

    public SudokuPuzzle generateDaily(LocalDate date) {
        return generate(Difficulty.MEDIUM, date.toString());
    }

    public SudokuPuzzle generate(Difficulty difficulty, String seed) {
        Random random = new Random(seed.hashCode());
        int[][] solution = new int[9][9];
        solve(solution, random);
        int[][] puzzle = copy(solution);
        List<int[]> cells = new ArrayList<>();
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                cells.add(new int[]{row, col});
            }
        }
        Collections.shuffle(cells, random);
        for (int i = 0; i < REMOVALS.get(difficulty); i++) {
            int[] cell = cells.get(i);
            puzzle[cell[0]][cell[1]] = 0;
        }
        return new SudokuPuzzle(puzzle, solution, difficulty, seed);
    }

    public boolean isValidMove(int[][] board, int row, int col, int value) {
        if (value < 1 || value > 9) {
            return false;
        }
        for (int i = 0; i < 9; i++) {
            if (i != col && board[row][i] == value) return false;
            if (i != row && board[i][col] == value) return false;
        }
        int boxRow = row / 3 * 3;
        int boxCol = col / 3 * 3;
        for (int r = boxRow; r < boxRow + 3; r++) {
            for (int c = boxCol; c < boxCol + 3; c++) {
                if ((r != row || c != col) && board[r][c] == value) return false;
            }
        }
        return true;
    }

    public boolean matchesSolution(int[][] board, int[][] solution) {
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                if (board[row][col] != solution[row][col]) return false;
            }
        }
        return true;
    }

    public int progressPercent(int[][] board) {
        int filled = 0;
        for (int[] row : board) {
            for (int value : row) {
                if (value != 0) filled++;
            }
        }
        return (int) Math.round(filled / 81.0 * 100);
    }

    public int[][] copy(int[][] board) {
        int[][] copy = new int[9][9];
        for (int i = 0; i < 9; i++) {
            System.arraycopy(board[i], 0, copy[i], 0, 9);
        }
        return copy;
    }

    private boolean solve(int[][] board, Random random) {
        int bestRow = -1;
        int bestCol = -1;
        List<Integer> bestCandidates = List.of();
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                if (board[row][col] != 0) continue;
                List<Integer> candidates = candidates(board, row, col, random);
                if (candidates.isEmpty()) return false;
                if (bestRow == -1 || candidates.size() < bestCandidates.size()) {
                    bestRow = row;
                    bestCol = col;
                    bestCandidates = candidates;
                }
            }
        }
        if (bestRow == -1) return true;
        for (Integer value : bestCandidates) {
            board[bestRow][bestCol] = value;
            if (solve(board, random)) return true;
            board[bestRow][bestCol] = 0;
        }
        return false;
    }

    private List<Integer> candidates(int[][] board, int row, int col, Random random) {
        List<Integer> values = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6, 7, 8, 9));
        Collections.shuffle(values, random);
        return values.stream().filter(value -> isValidMove(board, row, col, value)).toList();
    }
}
