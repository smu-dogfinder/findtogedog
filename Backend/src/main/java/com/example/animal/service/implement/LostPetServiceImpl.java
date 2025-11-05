package com.example.animal.service.implement;

import com.example.animal.dto.LostPetCreateRequestDto;
import com.example.animal.dto.LostPetResponseDto;
import com.example.animal.dto.UpdateLostPetRequestDto;
import com.example.animal.entity.LostPet;
import com.example.animal.entity.User;
import com.example.animal.repository.LostPetRepository;
import com.example.animal.repository.UserRepository;
import com.example.animal.service.LostPetService;
import com.example.animal.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LostPetServiceImpl implements LostPetService {

    private final LostPetRepository repo;
    private final UserRepository userRepository;   // 닉네임/회원 FK 조회
    private final StorageService storageService;   // 파일 저장

    @Override
    public Page<LostPetResponseDto> getPostsPaged(int page, int size, String viewerUserid) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<LostPet> p = repo.findAll(pageable);
        return p.map(LostPetResponseDto::fromEntity);
    }

    @Override
    public Optional<LostPetResponseDto> getPostById(Long id, String viewerUserid, boolean isAdmin) {
        return repo.findById(id).map(LostPetResponseDto::fromEntity);
        // 비공개 정책이 있다면 여기서 viewerUserid / isAdmin으로 필터링 추가
    }

    @Override
    @Transactional
    public LostPetResponseDto createPost(LostPetCreateRequestDto req, MultipartFile image,
                                         String userid, LocalDateTime nowParamIgnored) {
        // 1) 회원 조회 (FK 및 스냅샷에 사용)
        User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다: " + userid));
        

        // 2) 이미지 저장 (선택)
        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            try {
                imagePath = storageService.save(image);
            } catch (IOException e) {
                throw new RuntimeException("이미지 저장 실패", e);
            }
        }

        // 3) 엔터티 생성 — FK(memberNo)와 스냅샷(userid, nickname) 모두 세팅
        LostPet e = LostPet.builder()
                .memberNo(user)                 // ✅ FK: NOT NULL
                .userid(user.getUserid())       // ✅ 스냅샷
                .nickname(user.getNickname())   // ✅ 스냅샷
                .dogName(req.getDogName())
                .content(req.getContent())
                .species(req.getSpecies())
                .gender(req.getGender())
                .dateLost(req.getDateLost())
                .placeLost(req.getPlaceLost())
                .phone(req.getPhone())
                .imagePath(imagePath)
                .createdAt(LocalDateTime.now()) // PrePersist가 있으면 생략 가능
                .build();

        e = repo.save(e);
        return LostPetResponseDto.fromEntity(e);
    }

    @Override
    @Transactional
    public Optional<LostPetResponseDto> updatePost(Long id, UpdateLostPetRequestDto req,
                                                   String userid, boolean isAdmin) {
        LostPet entity = repo.findById(id).orElse(null);
        if (entity == null) return Optional.empty();

        // 권한 체크(소유자 또는 관리자)
        if (!isAdmin && !Objects.equals(entity.getUserid(), userid)) {
            return Optional.empty();
        }

        // 부분 업데이트
        if (req.getDogName() != null)   entity.setDogName(req.getDogName());
        if (req.getContent() != null)   entity.setContent(req.getContent());
        if (req.getSpecies() != null)   entity.setSpecies(req.getSpecies());
        if (req.getPlaceLost() != null) entity.setPlaceLost(req.getPlaceLost());
        if (req.getDateLost() != null)  entity.setDateLost(req.getDateLost());
        if (req.getPhone() != null)     entity.setPhone(req.getPhone());
        if (req.getGender() != null)    entity.setGender(req.getGender()); // enum이면 변환 로직 추가

        // 이미지 교체 (선택)
        if (req.getImage() != null && !req.getImage().isEmpty()) {
            try {
                String savedPath = storageService.save(req.getImage());
                entity.setImagePath(savedPath);
            } catch (IOException e) {
                throw new RuntimeException("이미지 저장 실패", e);
            }
        }

        return Optional.of(LostPetResponseDto.fromEntity(entity)); // dirty checking
    }

    @Override
    @Transactional
    public boolean deletePost(Long id, String userid, boolean isAdmin) {
        return repo.findById(id).map(e -> {
            boolean owner = StringUtils.hasText(userid) && userid.equals(e.getUserid());
            if (!owner && !isAdmin) return false;
            repo.delete(e);
            return true;
        }).orElse(false);
    }

    /* ===== 보조 ===== */
    private String resolveNickname(String userid) {
        return userRepository.findByUserid(userid)
                .map(User::getNickname)
                .orElse("사용자");
    }
}
