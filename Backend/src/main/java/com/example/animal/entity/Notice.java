package com.example.animal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)         // 제목은 필수 + 길이 제한 권장
    private String title;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    @Column(length = 100)                           // userid(작성자) 저장 용도
    private String author;

    @Column(nullable = false)                       // NULL 방지
    private int views;                              // 조회수

    @Column(nullable = false, updatable = false)    // 생성 시 고정
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /** 최초 저장 시 기본값/타임스탬프 자동 설정 */
    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = (this.createdAt == null) ? now : this.createdAt;
        this.updatedAt = now;
        // views가 0 미만이거나 null 개념이 없으므로, 음수 방지
        if (this.views < 0) this.views = 0;
    }

    /** 업데이트 시 수정 시각 자동 반영 */
    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
