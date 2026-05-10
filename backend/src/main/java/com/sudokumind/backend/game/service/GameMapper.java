package com.sudokumind.backend.game.service;

import com.sudokumind.backend.game.dto.GameSessionResponse;
import com.sudokumind.backend.game.entity.GameSession;
import org.springframework.stereotype.Component;

@Component
public class GameMapper {
    public GameSessionResponse toResponse(GameSession game) {
        return new GameSessionResponse(
                game.getId(),
                game.getPuzzle(),
                game.getSolution(),
                game.getCurrentBoard(),
                game.getDifficulty(),
                game.getStatus(),
                game.getMistakes(),
                game.getHintsUsed(),
                game.getElapsedSeconds(),
                game.getAccuracy(),
                game.isDaily(),
                game.getCreatedAt(),
                game.getCompletedAt()
        );
    }
}
