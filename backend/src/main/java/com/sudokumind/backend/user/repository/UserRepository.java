package com.sudokumind.backend.user.repository;

import com.sudokumind.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    List<User> findTop10ByUsernameContainingIgnoreCaseOrderByUsernameAsc(String username);

    List<User> findTop50ByUpdatedAtAfterOrderByUpdatedAtDesc(Instant since);
}
