package com.sudokumind.backend.multiplayer.repository;

import com.sudokumind.backend.multiplayer.entity.MultiplayerPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MultiplayerPlayerRepository extends JpaRepository<MultiplayerPlayer, UUID> {
    List<MultiplayerPlayer> findByRoomId(UUID roomId);

    Optional<MultiplayerPlayer> findByRoomIdAndUserId(UUID roomId, UUID userId);

    @Modifying
    @Query("""
            delete from MultiplayerPlayer player
            where player.user.id = :userId
               or player.room.hostUser.id = :userId
               or player.room.guestUser.id = :userId
               or player.room.winnerUser.id = :userId
            """)
    void deleteAllForUser(UUID userId);
}
