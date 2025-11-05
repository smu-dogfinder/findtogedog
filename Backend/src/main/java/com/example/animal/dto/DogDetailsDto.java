package com.example.animal.dto;

import com.example.animal.entity.DogDetails;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class DogDetailsDto {

    private Long id;
    private String number;
    private String species;
    private String gender;
    private String age;
    private String color;
    private String neutYn;
    private String jurisd;
    private LocalDate foundDate;
    private String foundLocation;
    private String state;
    private String imagePath;
    private String shelterId;
    private LocalDateTime createdAt;

    public DogDetailsDto(DogDetails entity) {
        this.id = entity.getId();
        this.number = entity.getNumber();
        this.species = entity.getSpecies();
        this.gender = entity.getGender();
        this.age = entity.getAge();
        this.color = entity.getColor();
        this.neutYn = entity.getNeutYn();
        this.jurisd = entity.getJurisd();
        this.foundDate = entity.getFoundDate();
        this.foundLocation = entity.getFoundLocation();
        this.state = entity.getState();
        this.imagePath = entity.getImagePath();
        this.shelterId = entity.getShelterId();
        this.createdAt = entity.getCreatedAt();
    }

    public static DogDetailsDto fromEntity(DogDetails entity) {
        return new DogDetailsDto(entity);
    }

}

