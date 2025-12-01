package com.example.animal.controller;

import com.example.animal.dto.SimilarDogResponseDto;
import com.example.animal.service.ImageSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/search")
public class ImageSearchController {

    private final ImageSearchService imageSearchService;

    // 기능 1: 유사 유기견 검색만
    @PostMapping("/image")
    public ResponseEntity<SimilarDogResponseDto> searchSimilarDogs(
            @RequestParam("image") MultipartFile image
    ) {
        return ResponseEntity.ok(imageSearchService.searchSimilarDogsOnly(image));
    }

    // 기능 2: 유사 유기견 + 성견 예측 이미지 생성
    @PostMapping("/generated")
    public ResponseEntity<SimilarDogResponseDto> searchWithGeneratedImage(@RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(imageSearchService.searchSimilarDogsWithGeneratedImage(image));
    }
}

