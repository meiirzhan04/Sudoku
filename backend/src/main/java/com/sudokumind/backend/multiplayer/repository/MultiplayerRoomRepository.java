package com.sudokumind.backend.multiplayer.repository;

import com.sudokumind.backend.multiplayer.entity.MultiplayerRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MultiplayerRoomRepository extends JpaRepository<MultiplayerRoom, UUID> {
    Optional<MultiplayerRoom> findByRoomCodeIgnoreCase(String roomCode);

    boolean existsByRoomCode(String roomCode);
}
