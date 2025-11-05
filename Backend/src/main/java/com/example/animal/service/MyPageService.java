package com.example.animal.service;

import com.example.animal.dto.UpdateInquiryRequestDto;
import com.example.animal.dto.UpdateLostPetRequestDto;
import com.example.animal.dto.UpdateUserRequestDto;
import com.example.animal.dto.UserDto;
import com.example.animal.entity.Inquiry;
import com.example.animal.entity.LostPet;
import com.example.animal.entity.User;
import com.example.animal.repository.InquiryRepository;
import com.example.animal.repository.LostPetRepository;
import com.example.animal.repository.UserRepository;
import com.example.animal.service.storage.StorageService;
import com.example.animal.util.AuthUtil;
import com.example.animal.util.Sha256;

import java.io.IOException; // 중요: io.jsonwebtoken.io.IOException 아님!

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class MyPageService {

    private final UserRepository userRepository;
    private final LostPetRepository lostPetRepository;
    private final InquiryRepository inquiryRepository;
    private final StorageService storageService;

    /** 현재 로그인 사용자(User) 조회 — 없으면 401 */
    private User currentUserOrThrow() {
        String userid = AuthUtil.currentUserid();
        if (userid == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return userRepository.findByUserid(userid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    /* ========================= 프로필 ========================= */

    @Transactional(readOnly = true)
    public UserDto getUser() {
        User u = currentUserOrThrow();
        String createdAtStr = (u.getCreatedAt() == null) ? null :
                u.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return UserDto.builder()
                .id(u.getId())
                .userid(u.getUserid())
                .nickname(u.getNickname())
                .email(u.getEmail())
                .role(u.getRole())
                .createdAt(createdAtStr)
                .build();
    }

    @Transactional
    public void updateUser(UpdateUserRequestDto req) {
        User u = currentUserOrThrow();

        if (req.getNickname() != null && !req.getNickname().isBlank()) {
            u.setNickname(req.getNickname().trim());
        }
        if (req.getEmail() != null) {
            u.setEmail(req.getEmail().trim());
        }
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            String newHash = Sha256.hashWithSalt(u.getSalt(), req.getNewPassword());
            u.setPassword(newHash);
        }
        userRepository.save(u);
    }

    /* ====================== 내가 쓴 분실신고 ====================== */

    @Transactional(readOnly = true)
    public Page<LostPet> myLostPets(int page, int size) {
        String userid = currentUserOrThrow().getUserid();
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );
        // LostPet은 userId(String)로 운영 중이라고 가정
        return lostPetRepository.findByUserid(userid, pageable);
    }

    @Transactional
    public void updateMyLostPet(Long id, UpdateLostPetRequestDto req) {
        String userid = currentUserOrThrow().getUserid();

        LostPet lp = lostPetRepository.findByIdAndUserid(id, userid)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "본인 글만 수정할 수 있습니다."));

        if (req.getDogName() != null)   lp.setDogName(req.getDogName().trim());
        if (req.getContent() != null)   lp.setContent(req.getContent().trim());
        if (req.getSpecies() != null)   lp.setSpecies(req.getSpecies());
        if (req.getGender() != null)    lp.setGender(req.getGender());
        if (req.getPlaceLost() != null) lp.setPlaceLost(req.getPlaceLost());
        if (req.getDateLost() != null)  lp.setDateLost(req.getDateLost()); // LocalDate
        if (req.getPhone() != null)     lp.setPhone(req.getPhone());

        if (req.getImage() != null && !req.getImage().isEmpty()) {
            try {
                String savedPath = storageService.save(req.getImage());
                lp.setImagePath(savedPath);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 저장 실패", e);
            }
        }
        if (Boolean.TRUE.equals(req.getRemoveImage())) {
            lp.setImagePath(null);
        }
    }

    @Transactional
    public void updateLostPetImagePath(Long lostPetId, String newImagePath) {
        String userid = currentUserOrThrow().getUserid();

        LostPet lp = lostPetRepository.findByIdAndUserid(lostPetId, userid)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "본인 글만 수정할 수 있습니다."));

        lp.setImagePath(newImagePath);
    }

    @Transactional
    public void deleteMyLostPet(Long id) {
        String userid = currentUserOrThrow().getUserid();
        LostPet lp = lostPetRepository.findByIdAndUserid(id, userid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 글만 삭제할 수 있습니다."));
        lostPetRepository.delete(lp);
    }

    /* ====================== 내가 쓴 문의글 ====================== */

    @Transactional(readOnly = true)
    public Page<Inquiry> myInquiries(int page, int size) {
        String userid = currentUserOrThrow().getUserid();
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );
        // 🔧 변경: 스냅샷 문자열 컬럼 기반 조회
        return inquiryRepository.findByUserid(userid, pageable);
        // (FK 기반을 원하면 아래로 교체)
        // Long userId = currentUserOrThrow().getId();
        // return inquiryRepository.findByMemberNo_Id(userId, pageable);
    }

    @Transactional
    public void updateMyInquiry(Long id, UpdateInquiryRequestDto req) {
        String userid = currentUserOrThrow().getUserid();

        // 🔧 변경: 소유자 확인 메서드 교체 (memberNo.userid 경로 탐색)
        Inquiry iq = inquiryRepository.findByIdAndMemberNo_Userid(id, userid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 글만 수정할 수 있습니다."));

        if (req.getTitle() != null)     iq.setTitle(req.getTitle().trim());
        if (req.getContent() != null)   iq.setContent(req.getContent().trim());
        if (req.getIsPublic() != null)  iq.setPublic(req.getIsPublic()); // boolean isPublic → setPublic(boolean)
        // JPA dirty checking으로 자동 반영
    }

    @Transactional
    public void deleteMyInquiry(Long id) {
        String userid = currentUserOrThrow().getUserid();

        // 🔧 변경: 소유자 확인 메서드 교체 (memberNo.userid 경로 탐색)
        Inquiry iq = inquiryRepository.findByIdAndMemberNo_Userid(id, userid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 글만 삭제할 수 있습니다."));
        inquiryRepository.delete(iq);
    }
}
