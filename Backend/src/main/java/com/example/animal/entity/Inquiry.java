package com.example.animal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "inquiry")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Inquiry {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK: inquiry.member_no → user.id */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_no", nullable = false)
    private User memberNo;   

    /** 작성자 로그인 ID 스냅샷 */
    @Column(name = "user_id", nullable = false, length = 50)
    private String userid;

    /** 작성자 닉네임 스냅샷 */
    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
