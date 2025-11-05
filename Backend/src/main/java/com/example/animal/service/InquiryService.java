package com.example.animal.service;

import com.example.animal.dto.InquiryCreateRequestDto;
import com.example.animal.dto.InquiryListItemDto;
import com.example.animal.dto.InquiryResponseDto;
import com.example.animal.dto.UpdateInquiryRequestDto;
import com.example.animal.dto.projection.InquiryListRowProjection;
import com.example.animal.entity.Inquiry;
import com.example.animal.entity.User;
import com.example.animal.repository.InquiryRepository;
import com.example.animal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;

    /* ================= 목록 ================= */

    /** 목록: 공개/비공개 무관, 작성 순(ASC)으로 번호(displayNo) 부여. */
    @Transactional(readOnly = true)
    public Page<InquiryListItemDto> getPaged(int page, int size, boolean isAdmin) {
        Pageable pageable = PageRequest.of(page, size); // 정렬은 네이티브에서
        Page<InquiryListRowProjection> raw = inquiryRepository.findPagedAllAscWithNo(pageable);

        return raw.map(p -> {
            boolean answeredFlag = p.getAnswered() != null && p.getAnswered() == 1;
            String title = p.getTitle();
            Boolean isPublic = p.getIsPublic();
            if (!isAdmin && Boolean.FALSE.equals(isPublic)) {
                title = "비공개글";
            }
            return InquiryListItemDto.builder()
                    .displayNo(p.getDisplayNo())
                    .id(p.getId())
                    .title(title)
                    .nickname(p.getNickname())
                    .createdAt(p.getCreatedAt())
                    .answered(answeredFlag)
                    .build();
        });
    }

    /* ================= 단건 조회 ================= */

    /** 단건 조회: 비공개면 작성자/관리자만 허용 */
    @Transactional(readOnly = true)
    public InquiryResponseDto getById(Long id, String currentUserid, boolean isAdmin) {
        Inquiry i = inquiryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("문의글을 찾을 수 없습니다."));

        if (!i.isPublic()) {
            boolean isOwner = (currentUserid != null) && currentUserid.equals(i.getUserid()); // ✅ getUserid()
            if (!isOwner && !isAdmin) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비공개 글입니다.");
            }
        }
        return toDetailDto(i);
    }

    /* ================= 생성 ================= */

    /** 글 작성: 로그인 필수, 닉네임/로그인ID 저장 */
    @Transactional
    public InquiryResponseDto createInquiry(String currentUserid, InquiryCreateRequestDto dto) {
        if (currentUserid == null || currentUserid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        User user = userRepository.findByUserid(currentUserid)
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다: " + currentUserid));

        Inquiry entity = Inquiry.builder()
                .memberNo(user)                              // ✅ FK 설정 (User)
                .userid(user.getUserid())                    // ✅ 스냅샷 (문자열)
                .nickname(user.getNickname())                // ✅ 스냅샷 (닉네임)
                .title(dto.getTitle())
                .content(dto.getContent())
                .isPublic(Boolean.TRUE.equals(dto.getIsPublic()))
                .createdAt(LocalDateTime.now())              // PrePersist가 있으면 생략 가능
                .build();

        return toDetailDto(inquiryRepository.save(entity));
    }

    /* ================= 수정 ================= */

    /** 글 수정: 본인 또는 관리자만 */
    @Transactional
    public InquiryResponseDto updateInquiry(Long id, String currentUserid,
                                            UpdateInquiryRequestDto dto, boolean isAdmin) {
        if (currentUserid == null || currentUserid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        Inquiry target;
        if (isAdmin) {
            target = inquiryRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("문의글을 찾을 수 없습니다."));
        } else {
            target = inquiryRepository.findByIdAndMemberNo_Userid(id, currentUserid) // ✅ 경로 수정
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.FORBIDDEN, "본인 글만 수정할 수 있습니다."));
        }

        target.setTitle(dto.getTitle());
        target.setContent(dto.getContent());
        if (dto.getIsPublic() != null) {
            target.setPublic(dto.getIsPublic()); // boolean isPublic → setPublic(...)
        }
        return toDetailDto(target); // JPA dirty checking
    }

    /* ================= 삭제 ================= */

    /** 글 삭제: 본인 또는 관리자만 */
    @Transactional
    public void deleteInquiry(Long id, String currentUserid, boolean isAdmin) {
        if (currentUserid == null || currentUserid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        Inquiry target;
        if (isAdmin) {
            target = inquiryRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("문의글을 찾을 수 없습니다."));
        } else {
            target = inquiryRepository.findByIdAndMemberNo_Userid(id, currentUserid) // ✅ 경로 수정
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.FORBIDDEN, "본인 글만 삭제할 수 있습니다."));
        }

        inquiryRepository.delete(target);
    }

    /* ================= DTO 변환 ================= */

    private InquiryResponseDto toDetailDto(Inquiry i) {
        return InquiryResponseDto.builder()
                .id(i.getId())
                .title(i.getTitle())
                .content(i.getContent())
                .nickname(i.getNickname())
                .isPublic(i.isPublic())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}
