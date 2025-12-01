package com.example.animal.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "inquiry_reply",
    indexes = {
        @Index(name = "idx_inquiryreply_inquiry_id", columnList = "inquiry_id"),
        @Index(name = "idx_inquiryreply_admin_user_id", columnList = "admin_user_id")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class InquiryReply {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 어떤 문의글의 댓글인지 (N:1) */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inquiry_id", nullable = false,
        foreignKey = @ForeignKey(ConstraintMode.CONSTRAINT))
    private Inquiry inquiry;

    /** (선택) 부모 댓글 — 대댓글 지원용. 최상위면 null */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id",
        foreignKey = @ForeignKey(ConstraintMode.CONSTRAINT))
    private InquiryReply parent;

    /** (선택) 자식 댓글 리스트 — mappedBy는 반드시 'parent' */
    @Builder.Default
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC, id ASC")
    private List<InquiryReply> children = new ArrayList<>();

    /** 댓글 작성자 닉네임(스냅샷) — 관리자 닉네임은 adminUser.getNickname() 사용 가능 */
    @Column(nullable = false, length = 50)
    private String nickname;

    /** 댓글 작성 관리자 (서비스 코드에서 사용) */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_user_id", nullable = false,
        foreignKey = @ForeignKey(ConstraintMode.CONSTRAINT))
    private User adminUser;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** 댓글 공개여부 (항상 inquiry.isPublic 과 동일하게 강제) */
    @Builder.Default
    @Column(name = "is_public", nullable = false)
    private boolean isPublic = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
        // ★ 부모 문의글 공개여부로 강제 동기화
        if (inquiry != null) this.isPublic = inquiry.isPublic();
    }
    @PreUpdate  void onUpdate() {
        updatedAt = LocalDateTime.now();
        // ★ 업데이트 시에도 부모 문의글 공개여부로 동기화
        if (inquiry != null) this.isPublic = inquiry.isPublic();
    }

    /** 편의 메서드 */
    public void addChild(InquiryReply child) {
        children.add(child);
        child.setParent(this);
        if (this.inquiry != null) child.setInquiry(this.inquiry);
    }
}
