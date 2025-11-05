package com.example.animal.entity;

import jakarta.persistence.*; // 또는 javax.persistence.* (버전에 따라 다름)

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "lost_report")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LostPet {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "member_no",
        nullable = false,
        foreignKey = @ForeignKey(ConstraintMode.CONSTRAINT) // DB의 FK와 일치
    )
    private User memberNo;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userid;

    @Column(name = "nickname", nullable = false, length = 50) // 자동 세팅
    private String nickname;

    @Column(name = "dog_name", length = 50)
    private String dogName;

    @Lob
    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    @Column(length = 50)
    private String species;

    @Column(length = 10)
    private String gender;

    @Column(name = "date_lost", nullable = false)
    private LocalDate dateLost;

    @Column(name = "place_lost", length = 100)
    private String placeLost;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "image_path", length = 255)
    private String imagePath;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}

