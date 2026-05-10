package com.sudokumind.backend.multiplayer.entity;

import com.sudokumind.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "multiplayer_moves")
public class MultiplayerMove {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id")
    private MultiplayerRoom room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    private int rowIndex;
    private int colIndex;
    private int value;
    @Column(name = "is_correct")
    private boolean isCorrect;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
