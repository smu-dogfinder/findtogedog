package com.example.animal.service;

import com.example.animal.dto.NoticeCreateRequestDto;
import com.example.animal.dto.NoticeResponseDto;
import com.example.animal.dto.projection.NoticeRowProjection;
import com.example.animal.entity.Notice;
import com.example.animal.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    /** 단건 조회(+조회수 증가) */
    @Transactional
    public NoticeResponseDto getNotice(Long id) {
        int updated = noticeRepository.incrementViews(id);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
        }
        Notice n = noticeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."));
        return toDto(n);
    }

    /** 전체 목록 (비권장: displayNo 없음. 필요 시 유지) */
    @Transactional(readOnly = true)
    public List<NoticeResponseDto> getAllNotices() {
        return noticeRepository.findAll().stream().map(this::toDto).toList();
    }

    /** 페이지 목록 기본형 */
    @Transactional(readOnly = true)
    public Page<NoticeResponseDto> getPagedNotices(int page, int size) {
        return getPagedNotices(page, size, "all", null);
    }

    /**
     * 페이지 목록 + 검색
     * - 목록 정렬: createdAt DESC, id DESC (최신글 우선)
     * - 키워드 없음: 네이티브 CTE로 전역 displayNo(과거→현재) 생성 후 DESC 정렬로 페이징
     * - 키워드 있음: JPA DESC 정렬 후 displayNo를 (검색결과 집합 기준) 큰 수 → 작은 수로 부여
     */
    @Transactional(readOnly = true)
    public Page<NoticeResponseDto> getPagedNotices(int page, int size, String type, String keyword) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);

        // 목록 정렬: 최신글 우선
        Pageable prDesc = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

        // 1) 키워드 없음: 네이티브 + CTE 사용 (displayNo는 ASC 전역 기준, 화면은 DESC)
        if (keyword == null || keyword.trim().isEmpty()) {
            int offset = safePage * safeSize;

            List<NoticeRowProjection> rawList = noticeRepository.findPagedWithRowNewestFirst(safeSize, offset);
            List<NoticeResponseDto> dtoList = rawList.stream()
                    .map(r -> NoticeResponseDto.builder()
                            .displayNo(r.getDisplayNo())
                            .id(r.getId())
                            .title(r.getTitle())
                            .content(r.getContent())
                            .author(r.getAuthor())
                            .views(r.getViews())
                            .createdAt(r.getCreatedAt())
                            .updatedAt(r.getUpdatedAt())
                            .build())
                    .toList();

            long total = noticeRepository.countAllForList();
            return new PageImpl<>(dtoList, prDesc, total);
        }

        // 2) 키워드 있음: JPA 검색 + DESC 정렬 + 전역 순번처럼 보이도록 번호 부여(검색 결과 기준)
        String q = keyword.trim();
        Page<Notice> result;
        if ("title".equalsIgnoreCase(type)) {
            result = noticeRepository.findByTitleContainingIgnoreCase(q, prDesc);
        } else if ("content".equalsIgnoreCase(type)) {
            result = noticeRepository.findByContentContainingIgnoreCase(q, prDesc);
        } else {
            result = noticeRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(q, q, prDesc);
        }

        long total = result.getTotalElements();
        int startNo = (int) (total - (long) safePage * safeSize); // 현재 페이지 첫 행의 표시 번호(큰 수 → 작은 수)

        List<NoticeResponseDto> dtoWithNo = IntStream.range(0, result.getContent().size())
                .mapToObj(i -> {
                    Notice n = result.getContent().get(i);
                    return NoticeResponseDto.builder()
                            .displayNo(startNo - i) // 최신글부터 내려가므로 전역 번호처럼 감소
                            .id(n.getId())
                            .title(n.getTitle())
                            .content(n.getContent())
                            .author(n.getAuthor())
                            .views(n.getViews())
                            .createdAt(n.getCreatedAt())
                            .updatedAt(n.getUpdatedAt())
                            .build();
                })
                .toList();

        return new PageImpl<>(dtoWithNo, prDesc, total);
    }

    /** 생성 (관리자 전용) → 생성된 ID 반환 */
    @Transactional
    public Long createNotice(NoticeCreateRequestDto dto) {
        String title = nonBlankOrBadRequest(dto.getTitle(), "title");
        String content = nonBlankOrBadRequest(dto.getContent(), "content");
        String authorUserId = currentUserIdOr("admin");

        Notice notice = Notice.builder()
                .title(title)
                .content(content)
                .author(authorUserId)
                .views(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Notice saved = noticeRepository.save(notice);
        return saved.getId();
    }

    /** 수정 (관리자 전용) */
    @Transactional
    public void updateNotice(Long id, NoticeCreateRequestDto dto) {
        String title = nonBlankOrBadRequest(dto.getTitle(), "title");
        String content = nonBlankOrBadRequest(dto.getContent(), "content");

        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."));

        notice.setTitle(title);
        notice.setContent(content);
        notice.setUpdatedAt(LocalDateTime.now());
        noticeRepository.save(notice);
    }

    /** 부분 수정 (선택) */
    @Transactional
    public void partialUpdateNotice(Long id, Map<String, Object> patch) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."));

        if (patch.containsKey("title")) {
            String title = toStringOrNull(patch.get("title"));
            notice.setTitle(nonBlankOrBadRequest(title, "title"));
        }
        if (patch.containsKey("content")) {
            String content = toStringOrNull(patch.get("content"));
            notice.setContent(nonBlankOrBadRequest(content, "content"));
        }
        notice.setUpdatedAt(LocalDateTime.now());
        noticeRepository.save(notice);
    }

    /** 삭제 (관리자 전용) */
    @Transactional
    public void deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
        }
        noticeRepository.deleteById(id);
    }

    /* ===== util ===== */

    private NoticeResponseDto toDto(Notice n) {
        return NoticeResponseDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .author(n.getAuthor())
                .views(n.getViews())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }

    private String currentUserIdOr(String fallback) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            return auth.getName();
        }
        return fallback;
    }

    private String nonBlankOrBadRequest(String v, String field) {
        if (v == null || v.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필수 입력 누락: " + field);
        }
        return v.trim();
    }

    private String toStringOrNull(Object o) {
        if (o == null) return null;
        String s = Objects.toString(o, null);
        return (s == null) ? null : s.trim();
    }
}
