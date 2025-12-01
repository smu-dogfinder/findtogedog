package com.example.animal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dog_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DogDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "number")
    private String number; // 공고번호

    @Column(name = "species")
    private String species; // 품종

    @Column(name = "gender")
    private String gender; // 성별

    @Column(name = "age")
    private String age; // 나이

    @Column(name = "color")
    private String color; // 색상

    @Column(name = "neut_YN")
    private String neutYn; // 중성화 여부

    @Column(name = "jurisd")
    private String jurisd; // 관할기관

    @Column(name = "found_date")
    private LocalDate foundDate; // 발견일자

    @Column(name = "found_location")
    private String foundLocation; // 발견장소

    @Column(name = "state")
    private String state; // 보호상태

    @Column(name = "image_path")
    private String imagePath; // 사진 경로

    @Column(name = "shelter_id")
    private String shelterId; // 보호소 FK

    @Column(name = "created_at")
    private LocalDateTime createdAt; // 등록일

}

