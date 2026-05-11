package com.sudokumind.backend.multiplayer.service;

import com.sudokumind.backend.common.enums.InviteStatus;
import com.sudokumind.backend.multiplayer.dto.*;
import com.sudokumind.backend.multiplayer.entity.GameInvite;
import com.sudokumind.backend.multiplayer.entity.MultiplayerRoom;
import com.sudokumind.backend.multiplayer.repository.GameInviteRepository;
import com.sudokumind.backend.multiplayer.repository.MultiplayerRoomRepository;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class GameInviteService {
    private final GameInviteRepository inviteRepository;
    private final MultiplayerRoomRepository roomRepository;
    private final MultiplayerService multiplayerService;
    private final UserService userService;

    public GameInviteService(GameInviteRepository inviteRepository, MultiplayerRoomRepository roomRepository, MultiplayerService multiplayerService, UserService userService) {
        this.inviteRepository = inviteRepository;
        this.roomRepository = roomRepository;
        this.multiplayerService = multiplayerService;
        this.userService = userService;
    }

    @Transactional
    public GameInviteResponse create(UUID senderId, GameInviteRequest request) {
        User sender = userService.require(senderId);
        User receiver = userService.require(request.friendId());
        MultiplayerRoom room = request.roomId() == null
                ? roomRepository.findById(multiplayerService.createRoom(senderId).roomId()).orElseThrow()
                : roomRepository.findById(request.roomId()).orElseThrow();
        GameInvite invite = new GameInvite();
        invite.setSender(sender);
        invite.setReceiver(receiver);
        invite.setRoom(room);
        invite.setExpiresAt(Instant.now().plusSeconds(15 * 60));
        return toResponse(inviteRepository.save(invite));
    }

    public List<GameInviteResponse> incoming(UUID userId) {
        return inviteRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(userId, InviteStatus.PENDING).stream().map(this::toResponse).toList();
    }

    @Transactional
    public GameInviteResponse accept(UUID userId, UUID inviteId) {
        GameInvite invite = inviteRepository.findByIdAndReceiverId(inviteId, userId).orElseThrow();
        invite.setStatus(InviteStatus.ACCEPTED);
        multiplayerService.join(userId, new JoinRoomRequest(invite.getRoom().getRoomCode()));
        return toResponse(inviteRepository.save(invite));
    }

    @Transactional
    public GameInviteResponse decline(UUID userId, UUID inviteId) {
        GameInvite invite = inviteRepository.findByIdAndReceiverId(inviteId, userId).orElseThrow();
        invite.setStatus(InviteStatus.DECLINED);
        return toResponse(inviteRepository.save(invite));
    }

    private GameInviteResponse toResponse(GameInvite invite) {
        return new GameInviteResponse(invite.getId(), invite.getSender().getId(), invite.getSender().getUsername(), invite.getReceiver().getId(), invite.getReceiver().getUsername(), invite.getRoom().getId(), invite.getRoom().getRoomCode(), invite.getStatus(), invite.getExpiresAt());
    }
}
