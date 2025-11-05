package com.example.animal.dto.admin;

import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Getter
public class AdminLostReportRowDto {
    private final Long id;
    private final String species;
    private final String gender;
    private final LocalDateTime createdAt;
    private final LocalDate dateLost;

    public AdminLostReportRowDto(Long id, String species, String gender,
                                 LocalDateTime createdAt, LocalDate dateLost) {
        this.id = id;
        this.species = species;
        this.gender = gender;
        this.createdAt = createdAt;
        this.dateLost = dateLost;
    }
    // getters ...
}
