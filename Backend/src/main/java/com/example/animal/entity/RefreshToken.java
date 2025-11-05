package com.example.animal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "refresh_token",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_refresh_token_nickname", columnNames = "nickname")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // refresh 토큰 해시는 중복 허용 → UNIQUE 제거
    @Column(nullable = false, length = 100)
    private String tokenHash;

    // 사용자별 1행만 존재하게 UNIQUE 제약
    @Column(nullable = false, length = 100)
    private String nickname;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean revoked;
}
