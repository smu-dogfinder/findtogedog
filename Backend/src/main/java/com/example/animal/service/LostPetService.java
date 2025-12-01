package com.example.animal.service;

import com.example.animal.dto.LostPetCreateRequestDto;
import com.example.animal.dto.LostPetResponseDto;
import com.example.animal.dto.UpdateLostPetRequestDto;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Optional;

public interface LostPetService {
    Page<LostPetResponseDto> getPostsPaged(int page, int size, String viewerId);

    // isAdmin 추가
    Optional<LostPetResponseDto> getPostById(Long id, String viewerId, boolean isAdmin);

    LostPetResponseDto createPost(LostPetCreateRequestDto req, MultipartFile image, String userId, LocalDateTime now);

    // isAdmin 추가
    Optional<LostPetResponseDto> updatePost(Long id, UpdateLostPetRequestDto req, String userId, boolean isAdmin);

    // isAdmin 추가
    boolean deletePost(Long id, String userId, boolean isAdmin);
}
