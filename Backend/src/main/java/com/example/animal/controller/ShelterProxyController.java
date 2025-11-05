package com.example.animal.controller;

import com.example.animal.service.ShelterProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shelters")
@RequiredArgsConstructor
public class ShelterProxyController {

    private final ShelterProxyService shelterProxyService;

    // 단일 엔드포인트
    @GetMapping
    public ResponseEntity<?> getShelters(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orgNm,
            @RequestParam(required = false) String search) {

        // 현재 서비스 시그니처는 (int, int) 만 지원 → 해당 메서드로 고정 호출
        return shelterProxyService.getShelterData(page, size);
    }

    // 선택: 필터 전용 경로를 유지하고 싶다면 동일 메서드로 연결
    @GetMapping("/filtered")
    public ResponseEntity<?> getSheltersFiltered(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orgNm,
            @RequestParam(required = false) String search) {

        // 현재 서비스는 (int, int)만 지원 → 동일 호출
        return shelterProxyService.getShelterData(page, size);
    }
}

