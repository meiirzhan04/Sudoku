package com.sudokumind.backend.friends.controller;

import com.sudokumind.backend.common.util.CurrentUser;
import com.sudokumind.backend.friends.dto.*;
import com.sudokumind.backend.friends.service.FriendService;
import com.sudokumind.backend.user.dto.PublicUserResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friends")
public class FriendController {
    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @PostMapping("/requests")
    public FriendRequestResponse send(@Valid @RequestBody FriendRequestCreateRequest request) {
        return friendService.send(CurrentUser.id(), request);
    }

    @GetMapping("/requests/incoming")
    public List<FriendRequestResponse> incoming() {
        return friendService.incoming(CurrentUser.id());
    }

    @GetMapping("/requests/outgoing")
    public List<FriendRequestResponse> outgoing() {
        return friendService.outgoing(CurrentUser.id());
    }

    @PutMapping("/requests/{id}/accept")
    public FriendRequestResponse accept(@PathVariable UUID id) {
        return friendService.accept(CurrentUser.id(), id);
    }

    @PutMapping("/requests/{id}/decline")
    public FriendRequestResponse decline(@PathVariable UUID id) {
        return friendService.decline(CurrentUser.id(), id);
    }

    @GetMapping
    public List<FriendResponse> friends() {
        return friendService.friends(CurrentUser.id());
    }

    @DeleteMapping("/{friendId}")
    public void remove(@PathVariable UUID friendId) {
        friendService.remove(CurrentUser.id(), friendId);
    }

    @GetMapping("/search")
    public List<PublicUserResponse> search(@RequestParam String username) {
        return friendService.search(username);
    }
}
