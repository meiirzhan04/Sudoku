package com.sudokumind.backend.multiplayer.repository;

import com.sudokumind.backend.common.enums.InviteStatus;
import com.sudokumind.backend.multiplayer.entity.GameInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GameInviteRepository extends JpaRepository<GameInvite, UUID> {
    List<GameInvite> findByReceiverIdAndStatusOrderByCreatedAtDesc(UUID receiverId, InviteStatus status);

    Optional<GameInvite> findByIdAndReceiverId(UUID id, UUID receiverId);
}
