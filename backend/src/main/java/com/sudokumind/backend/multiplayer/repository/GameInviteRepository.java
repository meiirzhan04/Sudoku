package com.sudokumind.backend.multiplayer.repository;

import com.sudokumind.backend.common.enums.InviteStatus;
import com.sudokumind.backend.multiplayer.entity.GameInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GameInviteRepository extends JpaRepository<GameInvite, UUID> {
    List<GameInvite> findByReceiverIdAndStatusOrderByCreatedAtDesc(UUID receiverId, InviteStatus status);

    Optional<GameInvite> findByIdAndReceiverId(UUID id, UUID receiverId);

    @Modifying
    @Query("""
            delete from GameInvite invite
            where invite.sender.id = :userId
               or invite.receiver.id = :userId
               or invite.room.hostUser.id = :userId
               or invite.room.guestUser.id = :userId
               or invite.room.winnerUser.id = :userId
            """)
    void deleteAllForUser(UUID userId);
}
