package com.sudokumind.backend.friends.repository;

import com.sudokumind.backend.friends.entity.Friend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface FriendRepository extends JpaRepository<Friend, UUID> {
    long countByUserId(UUID userId);

    boolean existsByUserIdAndFriendId(UUID userId, UUID friendId);

    List<Friend> findByUserIdOrderByCreatedAtDesc(UUID userId);

    void deleteByUserIdAndFriendId(UUID userId, UUID friendId);

    @Modifying
    @Query("delete from Friend f where f.user.id = :userId or f.friend.id = :userId")
    void deleteAllForUser(UUID userId);
}
