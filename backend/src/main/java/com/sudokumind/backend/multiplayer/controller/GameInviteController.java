package com.sudokumind.backend.multiplayer.controller;

import com.sudokumind.backend.common.util.CurrentUser;
import com.sudokumind.backend.multiplayer.dto.GameInviteRequest;
import com.sudokumind.backend.multiplayer.dto.GameInviteResponse;
import com.sudokumind.backend.multiplayer.service.GameInviteService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/game-invites")
public class GameInviteController {
    private final GameInviteService gameInviteService;

    public GameInviteController(GameInviteService gameInviteService) {
        this.gameInviteService = gameInviteService;
    }

    @PostMapping
    public GameInviteResponse create(@Valid @RequestBody GameInviteRequest request) {
        return gameInviteService.create(CurrentUser.id(), request);
    }

    @GetMapping("/incoming")
    public List<GameInviteResponse> incoming() {
        return gameInviteService.incoming(CurrentUser.id());
    }

    @PutMapping("/{id}/accept")
    public GameInviteResponse accept(@PathVariable UUID id) {
        return gameInviteService.accept(CurrentUser.id(), id);
    }

    @PutMapping("/{id}/decline")
    public GameInviteResponse decline(@PathVariable UUID id) {
        return gameInviteService.decline(CurrentUser.id(), id);
    }
}
