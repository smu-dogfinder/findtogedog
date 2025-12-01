package com.example.animal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50, unique = true) // 중복 허용 X
    private String nickname;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 50, unique = true) // 고유하게
    private String userid; 

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String role;

    private LocalDateTime createdAt;

    @Column(nullable = false, length = 64)
    private String salt;  // 사용자별 salt 저장

    /** 회원 → 문의글 (일대다) */
    @JsonIgnore
    @OneToMany(mappedBy = "memberNo", fetch = FetchType.LAZY,
               cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Inquiry> inquiries = new ArrayList<>();

    /** 회원 → 분실신고 (일대다) */
    @JsonIgnore
    @OneToMany(mappedBy = "memberNo", fetch = FetchType.LAZY,
               cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<LostPet> lostReports = new ArrayList<>();
}

