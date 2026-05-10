package com.sudokumind.backend.multiplayer.entity;

import com.sudokumind.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "multiplayer_players")
public class MultiplayerPlayer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id")
    private MultiplayerRoom room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private int[][] currentBoard;

    private int mistakes;
    private int elapsedSeconds;
    private int progressPercent;
    @Column(name = "is_connected")
    private boolean isConnected = true;
    private Instant finishedAt;
}
