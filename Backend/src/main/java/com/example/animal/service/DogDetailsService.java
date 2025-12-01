package com.example.animal.service;

import com.example.animal.dto.DogDetailsDto;
import com.example.animal.entity.DogDetails;
import com.example.animal.repository.DogDetailsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class DogDetailsService {

    private final DogDetailsRepository dogDetailsRepository;

    /** 전체 페이징 (필터 없음) */
    public Page<DogDetailsDto> getDogDetails(int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "foundDate", "id")
        );
        Page<DogDetails> entityPage = dogDetailsRepository.findAllByOrderByFoundDateDesc(pageable);
        return entityPage.map(DogDetailsDto::fromEntity);
    }

    /** 단건 조회 */
    public Optional<DogDetailsDto> getDogDetailsById(Long id) {
        return dogDetailsRepository.findById(id).map(DogDetailsDto::fromEntity);
    }

    /** 전체 목록 반환(페이징 없이 모두) */
    public List<DogDetailsDto> getAllDogDetails() {
        return dogDetailsRepository.findAll().stream()
                .map(DogDetailsDto::fromEntity)
                .toList();
    }

    public List<String> getAllBreeds() {
        return dogDetailsRepository.findDistinctSpecies();
    }

    /** 페이징 + (옵션)필터 */
    public Page<DogDetailsDto> searchDogsPaged(String jurisd, String species, String keyword,
                                               int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "foundDate", "id")
        );

        // 모든 필터가 비어 있으면 전체 페이징과 동일 동작
        if (isBlank(jurisd) && isBlank(species) && isBlank(keyword)) {
            return getDogDetails(page, size);
        }

        Page<DogDetails> result = dogDetailsRepository
                .searchByConditionsPaged(emptyToNull(jurisd), emptyToNull(species), emptyToNull(keyword), pageable);

        return result.map(DogDetailsDto::fromEntity);
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String emptyToNull(String s) {
        return isBlank(s) ? null : s.trim();
    }
}

