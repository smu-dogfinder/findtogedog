package com.example.animal.dto;

import com.example.animal.entity.LostPet;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class LostPetResponseDto {

    private Long id;
    private String dogName;
    private String content;
    private String species;
    private String gender;
    private LocalDate dateLost;
    private String placeLost;
    private String phone;
    private String imagePath;
    private String nickname;      // 항상 노출
    private String userid;
    private LocalDateTime createdAt;

    public static LostPetResponseDto fromEntity(LostPet e) {
        if (e == null) return null;
        return LostPetResponseDto.builder()
                .id(e.getId())
                .userid(e.getUserid())
                .nickname(e.getNickname())
                .dogName(e.getDogName())
                .content(e.getContent())
                .species(e.getSpecies())
                .gender(e.getGender())
                .dateLost(e.getDateLost())
                .placeLost(e.getPlaceLost())
                .phone(e.getPhone())
                .imagePath(e.getImagePath())
                .createdAt(e.getCreatedAt())
                .build();
    }

}

