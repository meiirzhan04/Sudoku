package com.sudokumind.backend.game.controller;

import com.sudokumind.backend.common.util.CurrentUser;
import com.sudokumind.backend.game.dto.*;
import com.sudokumind.backend.game.service.GameService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping
    public GameSessionResponse create(@Valid @RequestBody CreateGameRequest request) {
        return gameService.create(CurrentUser.id(), request);
    }

    @PostMapping("/new")
    public GameSessionResponse createNew(@Valid @RequestBody CreateGameRequest request) {
        return gameService.create(CurrentUser.id(), request);
    }

    @GetMapping("/{id}")
    public GameSessionResponse get(@PathVariable UUID id) {
        return gameService.get(CurrentUser.id(), id);
    }

    @PutMapping("/{id}/move")
    public MoveResponse move(@PathVariable UUID id, @Valid @RequestBody MoveRequest request) {
        return gameService.move(CurrentUser.id(), id, request);
    }

    @PutMapping("/{id}/save")
    public GameSessionResponse save(@PathVariable UUID id, @Valid @RequestBody SaveGameRequest request) {
        return gameService.save(CurrentUser.id(), id, request);
    }

    @PostMapping("/{id}/complete")
    public GameSessionResponse complete(@PathVariable UUID id) {
        return gameService.complete(CurrentUser.id(), id);
    }

    @GetMapping("/history")
    public List<GameSessionResponse> history() {
        return gameService.history(CurrentUser.id());
    }

    @GetMapping("/resume")
    public GameSessionResponse resume() {
        return gameService.resume(CurrentUser.id());
    }

    @GetMapping("/active")
    public GameSessionResponse active() {
        return gameService.resume(CurrentUser.id());
    }
}
