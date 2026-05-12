package com.sudokumind.backend.multiplayer.repository;

import com.sudokumind.backend.multiplayer.entity.MultiplayerRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface MultiplayerRoomRepository extends JpaRepository<MultiplayerRoom, UUID> {
    Optional<MultiplayerRoom> findByRoomCodeIgnoreCase(String roomCode);

    boolean existsByRoomCode(String roomCode);

    @Modifying
    @Query("""
            delete from MultiplayerRoom room
            where room.hostUser.id = :userId
               or room.guestUser.id = :userId
               or room.winnerUser.id = :userId
            """)
    void deleteAllForUser(UUID userId);
}
