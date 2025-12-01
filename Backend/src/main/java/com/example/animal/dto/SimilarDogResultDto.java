package com.example.animal.dto;

import lombok.Data;

@Data
public class SimilarDogResultDto {
    private Long id;
    private int rank;
    private double similarity;
}
