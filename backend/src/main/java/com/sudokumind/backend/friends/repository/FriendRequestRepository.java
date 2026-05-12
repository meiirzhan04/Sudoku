package com.sudokumind.backend.friends.repository;

import com.sudokumind.backend.common.enums.FriendRequestStatus;
import com.sudokumind.backend.friends.entity.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, UUID> {
    boolean existsBySenderIdAndReceiverIdAndStatus(UUID senderId, UUID receiverId, FriendRequestStatus status);

    List<FriendRequest> findByReceiverIdAndStatusOrderByCreatedAtDesc(UUID receiverId, FriendRequestStatus status);

    List<FriendRequest> findBySenderIdAndStatusOrderByCreatedAtDesc(UUID senderId, FriendRequestStatus status);

    Optional<FriendRequest> findByIdAndReceiverId(UUID id, UUID receiverId);

    @Modifying
    @Query("delete from FriendRequest r where r.sender.id = :userId or r.receiver.id = :userId")
    void deleteAllForUser(UUID userId);
}
