package com.example.animal.dto;

import lombok.Data;
import java.util.List;

@Data
public class SimilarDogResponseDto {
    private List<DogDetailsDto> dogs;
    private String generatedImageBase64;
}

