package com.sudokumind.backend.game.service;

import com.sudokumind.backend.common.enums.GameStatus;
import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.game.dto.*;
import com.sudokumind.backend.game.entity.GameSession;
import com.sudokumind.backend.game.repository.GameSessionRepository;
import com.sudokumind.backend.game.sudoku.SudokuEngine;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class GameService {
    private final GameSessionRepository repository;
    private final SudokuEngine sudokuEngine;
    private final GameMapper mapper;
    private final UserService userService;

    public GameService(GameSessionRepository repository, SudokuEngine sudokuEngine, GameMapper mapper, UserService userService) {
        this.repository = repository;
        this.sudokuEngine = sudokuEngine;
        this.mapper = mapper;
        this.userService = userService;
    }

    @Transactional
    public GameSessionResponse create(UUID userId, CreateGameRequest request) {
        User user = userService.require(userId);
        var puzzle = sudokuEngine.generate(request.difficulty());
        GameSession game = new GameSession();
        game.setUser(user);
        game.setPuzzle(puzzle.puzzle());
        game.setSolution(puzzle.solution());
        game.setCurrentBoard(sudokuEngine.copy(puzzle.puzzle()));
        game.setDifficulty(request.difficulty());
        return mapper.toResponse(repository.save(game));
    }

    public GameSessionResponse get(UUID userId, UUID id) {
        return mapper.toResponse(requireOwned(userId, id));
    }

    @Transactional
    public MoveResponse move(UUID userId, UUID id, MoveRequest request) {
        GameSession game = requireOwned(userId, id);
        int[][] board = sudokuEngine.copy(game.getCurrentBoard());
        boolean correct = game.getSolution()[request.row()][request.col()] == request.value();
        board[request.row()][request.col()] = request.value();
        game.setCurrentBoard(board);
        if (!correct && request.value() != 0) {
            game.setMistakes(game.getMistakes() + 1);
        }
        game.setAccuracy(accuracy(board, game.getMistakes()));
        if (sudokuEngine.matchesSolution(board, game.getSolution())) {
            game.setStatus(GameStatus.COMPLETED);
            game.setCompletedAt(Instant.now());
        }
        repository.save(game);
        return new MoveResponse(correct, game.getCurrentBoard(), game.getMistakes(), sudokuEngine.progressPercent(board), game.getStatus());
    }

    @Transactional
    public GameSessionResponse save(UUID userId, UUID id, SaveGameRequest request) {
        GameSession game = requireOwned(userId, id);
        game.setCurrentBoard(request.currentBoard());
        game.setMistakes(request.mistakes());
        game.setElapsedSeconds(request.elapsedSeconds());
        game.setHintsUsed(request.hintsUsed());
        game.setAccuracy(accuracy(request.currentBoard(), request.mistakes()));
        return mapper.toResponse(repository.save(game));
    }

    @Transactional
    public GameSessionResponse complete(UUID userId, UUID id) {
        GameSession game = requireOwned(userId, id);
        if (sudokuEngine.matchesSolution(game.getCurrentBoard(), game.getSolution())) {
            game.setStatus(GameStatus.COMPLETED);
            game.setCompletedAt(Instant.now());
        } else {
            game.setStatus(GameStatus.FAILED);
        }
        return mapper.toResponse(repository.save(game));
    }

    public List<GameSessionResponse> history(UUID userId) {
        return repository.findTop30ByUserIdOrderByCreatedAtDesc(userId).stream().map(mapper::toResponse).toList();
    }

    public GameSessionResponse resume(UUID userId) {
        return repository.findFirstByUserIdAndStatusOrderByUpdatedAtDesc(userId, GameStatus.IN_PROGRESS)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ApiException(ErrorCode.GAME_NOT_FOUND));
    }

    public GameSession requireOwned(UUID userId, UUID id) {
        GameSession game = repository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.GAME_NOT_FOUND));
        if (game.getUser() == null || !game.getUser().getId().equals(userId)) {
            throw new ApiException(ErrorCode.GAME_NOT_FOUND);
        }
        return game;
    }

    private BigDecimal accuracy(int[][] board, int mistakes) {
        int filled = 0;
        for (int[] row : board) {
            for (int value : row) {
                if (value != 0) filled++;
            }
        }
        if (filled == 0) return BigDecimal.valueOf(100);
        return BigDecimal.valueOf(Math.max(0, (filled - mistakes) * 100.0 / filled)).setScale(2, RoundingMode.HALF_UP);
    }
}
