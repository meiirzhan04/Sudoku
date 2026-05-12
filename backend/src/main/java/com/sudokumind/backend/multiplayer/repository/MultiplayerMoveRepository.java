package com.sudokumind.backend.multiplayer.repository;

import com.sudokumind.backend.multiplayer.entity.MultiplayerMove;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface MultiplayerMoveRepository extends JpaRepository<MultiplayerMove, UUID> {
    @Modifying
    @Query("""
            delete from MultiplayerMove move
            where move.user.id = :userId
               or move.room.hostUser.id = :userId
               or move.room.guestUser.id = :userId
               or move.room.winnerUser.id = :userId
            """)
    void deleteAllForUser(UUID userId);
}
