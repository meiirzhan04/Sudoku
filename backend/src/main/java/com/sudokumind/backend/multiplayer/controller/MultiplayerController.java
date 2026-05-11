package com.sudokumind.backend.multiplayer.controller;

import com.sudokumind.backend.common.util.CurrentUser;
import com.sudokumind.backend.multiplayer.dto.*;
import com.sudokumind.backend.multiplayer.service.MultiplayerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/multiplayer/rooms")
public class MultiplayerController {
    private final MultiplayerService multiplayerService;

    public MultiplayerController(MultiplayerService multiplayerService) {
        this.multiplayerService = multiplayerService;
    }

    @PostMapping
    public CreateRoomResponse create(@RequestBody(required = false) CreateBattleRoomRequest request) {
        if (request == null) {
            return multiplayerService.createRoom(CurrentUser.id());
        }
        return multiplayerService.createRoom(CurrentUser.id(), request.difficulty(), request.mode());
    }

    @PostMapping("/join")
    public RoomResponse join(@Valid @RequestBody JoinRoomRequest request) {
        return multiplayerService.join(CurrentUser.id(), request);
    }

    @GetMapping("/{roomId}")
    public RoomResponse room(@PathVariable UUID roomId) {
        return multiplayerService.room(roomId, CurrentUser.id());
    }

    @PostMapping("/{roomId}/start")
    public RoomResponse start(@PathVariable UUID roomId) {
        return multiplayerService.start(CurrentUser.id(), roomId);
    }

    @PostMapping("/{roomId}/rematch")
    public RoomResponse rematch(@PathVariable UUID roomId) {
        return multiplayerService.rematch(CurrentUser.id(), roomId);
    }

    @PostMapping("/{roomId}/leave")
    public RoomResponse leave(@PathVariable UUID roomId) {
        return multiplayerService.leave(CurrentUser.id(), roomId);
    }

    @PutMapping("/{roomId}/move")
    public RoomEvent move(@PathVariable UUID roomId, @Valid @RequestBody MultiplayerMoveRequest request) {
        return multiplayerService.move(CurrentUser.id(), roomId, request);
    }

    @PutMapping("/{roomId}/progress")
    public RoomEvent progress(@PathVariable UUID roomId, @Valid @RequestBody ProgressRequest request) {
        return multiplayerService.progress(CurrentUser.id(), roomId, request);
    }
}
