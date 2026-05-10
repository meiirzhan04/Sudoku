package com.sudokumind.backend.multiplayer.repository;

import com.sudokumind.backend.multiplayer.entity.MultiplayerPlayer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MultiplayerPlayerRepository extends JpaRepository<MultiplayerPlayer, UUID> {
    List<MultiplayerPlayer> findByRoomId(UUID roomId);

    Optional<MultiplayerPlayer> findByRoomIdAndUserId(UUID roomId, UUID userId);
}
