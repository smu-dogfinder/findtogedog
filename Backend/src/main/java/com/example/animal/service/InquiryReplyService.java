package com.example.animal.service;

import com.example.animal.dto.InquiryReplyRequestDto;
import com.example.animal.dto.InquiryReplyResponseDto;
import com.example.animal.entity.Inquiry;
import com.example.animal.entity.InquiryReply;
import com.example.animal.entity.User;
import com.example.animal.repository.InquiryReplyRepository;
import com.example.animal.repository.InquiryRepository;
import com.example.animal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InquiryReplyService {

    private final InquiryReplyRepository inquiryReplyRepository;
    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;

    private User getCurrentUser(String userid) {
        return userRepository.findByUserid(userid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && user.getRole().toUpperCase().contains("ADMIN");
    }

    /** 댓글 생성 (관리자 전용) — 댓글 공개여부는 문의글과 동일로 강제 */
    @Transactional
    public InquiryReplyResponseDto create(Long inquiryId, InquiryReplyRequestDto req, String currentUserid) {
        User current = getCurrentUser(currentUserid);
        if (!isAdmin(current)) throw new AccessDeniedException("관리자만 댓글을 작성할 수 있습니다.");

        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다."));

        InquiryReply reply = InquiryReply.builder()
                .inquiry(inquiry)
                .adminUser(current)
                .nickname(current.getNickname() != null ? current.getNickname() : "관리자") // 필요 시
                .content(req.getContent())
                // .isPublic(...) 세팅 안 해도 @PrePersist에서 inquiry.isPublic으로 덮어씀
                .build();

        InquiryReply saved = inquiryReplyRepository.save(reply);
        return toDto(saved);
    }

    /** 댓글 목록 — 비공개 문의글이면 작성자/관리자만 접근 허용 */
    @Transactional(readOnly = true)
    public List<InquiryReplyResponseDto> list(Long inquiryId, String currentUseridOrNull) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다."));

        String ownerUserid = inquiry.getUserid();
        boolean inquiryPublic = inquiry.isPublic();

        boolean viewerIsAdmin = false;
        boolean isOwner = false;

        if (!inquiryPublic) {
            if (currentUseridOrNull == null) {
                throw new AccessDeniedException("비공개 문의글의 댓글은 작성자 또는 관리자만 조회할 수 있습니다.");
            }
            User viewer = userRepository.findByUserid(currentUseridOrNull)
                    .orElseThrow(() -> new AccessDeniedException("권한이 없습니다."));
            viewerIsAdmin = isAdmin(viewer);
            isOwner = ownerUserid != null && ownerUserid.equals(viewer.getUserid());
            if (!(viewerIsAdmin || isOwner)) {
                throw new AccessDeniedException("비공개 문의글의 댓글은 작성자 또는 관리자만 조회할 수 있습니다.");
            }
        }

        List<InquiryReply> list = inquiryReplyRepository.findByInquiryIdOrderByCreatedAtAsc(inquiryId);

        // 댓글 공개여부 = 문의글 공개여부이므로 per-reply 필터 불필요
        List<InquiryReplyResponseDto> result = new ArrayList<>(list.size());
        for (InquiryReply r : list) {
            result.add(toDto(r));
        }
        return result;
    }

    /** 댓글 수정 (관리자 전용) — 공개여부 변경 시도는 무시(또는 거부) */
    @Transactional
    public InquiryReplyResponseDto update(Long inquiryId, Long replyId, InquiryReplyRequestDto req, String currentUserid) {
        User current = getCurrentUser(currentUserid);
        if (!isAdmin(current)) throw new AccessDeniedException("관리자만 댓글을 수정할 수 있습니다.");

        InquiryReply reply = inquiryReplyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!reply.getInquiry().getId().equals(inquiryId)) {
            throw new IllegalArgumentException("경로의 inquiryId와 댓글의 inquiryId가 일치하지 않습니다.");
        }

        if (req.getContent() != null) reply.setContent(req.getContent());

        // 공개여부는 항상 문의글과 동일하게 — 클라이언트 입력 무시
        reply.setPublic(reply.getInquiry().isPublic());

        return toDto(reply);
    }

    /** 댓글 삭제 (관리자 전용) */
    @Transactional
    public void delete(Long inquiryId, Long replyId, String currentUserid) {
        User current = getCurrentUser(currentUserid);
        if (!isAdmin(current)) throw new AccessDeniedException("관리자만 댓글을 삭제할 수 있습니다.");

        InquiryReply reply = inquiryReplyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!reply.getInquiry().getId().equals(inquiryId)) {
            throw new IllegalArgumentException("경로의 inquiryId와 댓글의 inquiryId가 일치하지 않습니다.");
        }

        inquiryReplyRepository.delete(reply);
    }

    private InquiryReplyResponseDto toDto(InquiryReply r) {
        // r.isPublic() == r.getInquiry().isPublic() (엔티티에서 이미 동기화)
        return InquiryReplyResponseDto.builder()
                .id(r.getId())
                .inquiryId(r.getInquiry().getId())
                .adminUserId(r.getAdminUser().getId())
                .adminNickname(r.getAdminUser().getNickname())
                .content(r.getContent())
                .isPublic(r.isPublic())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
