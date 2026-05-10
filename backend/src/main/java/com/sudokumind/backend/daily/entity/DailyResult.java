package com.sudokumind.backend.daily.entity;

import com.sudokumind.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "daily_results")
public class DailyResult {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "daily_challenge_id")
    private DailyChallenge dailyChallenge;

    private int timeSeconds;
    private int mistakes;
    private BigDecimal accuracy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant completedAt;
}
