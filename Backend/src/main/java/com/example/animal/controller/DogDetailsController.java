package com.example.animal.controller;

import com.example.animal.dto.DogDetailsDto;
import com.example.animal.service.DogDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.*;

@RestController
@RequestMapping("/api/dog-details")
@RequiredArgsConstructor
public class DogDetailsController {

    private final DogDetailsService dogdetailsService;

    /** 전체 데이터 반환(페이징 없이 모두) */
    @GetMapping
    public List<DogDetailsDto> getAllDogDetails() {
        return dogdetailsService.getAllDogDetails();
    }

    /** 페이징 + (옵션) 필터: jurisd/species/keyword */
    @GetMapping("/paged")
    public ResponseEntity<Map<String, Object>> getDogDetailsPaged(
            @RequestParam(required = false) String jurisd,
            @RequestParam(required = false) String species,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        Page<DogDetailsDto> pageResult =
                dogdetailsService.searchDogsPaged(jurisd, species, keyword, page, size);

        return toPagedResponse(pageResult, request, page, size);
    }

    /** 단건 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<DogDetailsDto> getDogDetailsById(@PathVariable Long id) {
        return dogdetailsService.getDogDetailsById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** 품종 목록 */
    @GetMapping("/breeds")
    public ResponseEntity<List<String>> getAllBreeds() {
        return ResponseEntity.ok(dogdetailsService.getAllBreeds());
    }

    // ===== 공통: Page -> 표준 응답(Map) 변환 =====
    private <T> ResponseEntity<Map<String, Object>> toPagedResponse(
            Page<T> pageResult, HttpServletRequest request, int page, int size) {

        Map<String, Object> response = new HashMap<>();
        response.put("data", pageResult.getContent());

        int totalPages = pageResult.getTotalPages();
        int currentPage = pageResult.getNumber() + 1; // 1-based
        int blockSize = 10;

        int startPage = ((currentPage - 1) / blockSize) * blockSize + 1;
        int endPage = Math.min(startPage + blockSize - 1, totalPages);

        // meta
        Map<String, Object> meta = new HashMap<>();
        meta.put("itemPerPage", pageResult.getSize());
        meta.put("totalItems", pageResult.getTotalElements());
        meta.put("currentPage", currentPage);
        meta.put("totalPages", totalPages);
        meta.put("startPage", startPage);
        meta.put("endPage", endPage);

        // links: 기존 쿼리파라미터(jurisd/species/keyword) 보존 + page/size만 교체
        UriComponentsBuilder base = ServletUriComponentsBuilder.fromRequest(request)
                .replaceQueryParam("size", size);

        Map<String, String> links = new HashMap<>();
        links.put("first",    base.replaceQueryParam("page", 0).toUriString());
        links.put("previous", base.replaceQueryParam("page", Math.max(page - 1, 0)).toUriString());
        links.put("current",  base.replaceQueryParam("page", page).toUriString());
        links.put("next",     base.replaceQueryParam("page", Math.min(page + 1, Math.max(totalPages - 1, 0))).toUriString());
        links.put("last",     base.replaceQueryParam("page", Math.max(totalPages - 1, 0)).toUriString());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", currentPage);
        pagination.put("meta", meta);
        pagination.put("links", links);

        response.put("pagination", pagination);
        return ResponseEntity.ok(response);
    }
}


