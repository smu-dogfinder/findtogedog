package com.example.animal.controller;

import com.example.animal.dto.NoticeCreateRequestDto;
import com.example.animal.dto.NoticeResponseDto;
import com.example.animal.service.NoticeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    /** 전체 목록 (공개) */
    @GetMapping
    public List<NoticeResponseDto> getAll() {
        return noticeService.getAllNotices();
    }

    /** 페이지 목록 (공개) */
    @GetMapping("/paged")
    public ResponseEntity<Map<String, Object>> getPagedNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "all") String type,
            @RequestParam(name = "q", required = false) String keyword,
            HttpServletRequest request) {

        Page<NoticeResponseDto> pageResult =
                noticeService.getPagedNotices(page, size, type, keyword);

        Map<String, Object> response = new HashMap<>();
        response.put("data", pageResult.getContent());

        int totalPages = pageResult.getTotalPages();
        int currentPage = pageResult.getNumber() + 1;
        int blockSize = 10;
        int startPage = ((currentPage - 1) / blockSize) * blockSize + 1;
        int endPage = Math.min(startPage + blockSize - 1, totalPages);

        Map<String, Object> meta = new HashMap<>();
        meta.put("itemPerPage", pageResult.getSize());
        meta.put("totalItems", pageResult.getTotalElements());
        meta.put("currentPage", currentPage);
        meta.put("totalPages", totalPages);
        meta.put("startPage", startPage);
        meta.put("endPage", endPage);

        // 쿼리 파라미터(type, q) 유지하며 page/size만 변경
        UriComponentsBuilder base = ServletUriComponentsBuilder.fromRequest(request)
                .replaceQueryParam("type", type)
                .replaceQueryParam("q", keyword)
                .replaceQueryParam("size", size);

        Map<String, String> links = new HashMap<>();
        links.put("first",   base.replaceQueryParam("page", 0).toUriString());
        links.put("previous",base.replaceQueryParam("page", Math.max(page - 1, 0)).toUriString());
        links.put("current", base.replaceQueryParam("page", page).toUriString());
        links.put("next",    base.replaceQueryParam("page", Math.min(page + 1, Math.max(totalPages - 1, 0))).toUriString());
        links.put("last",    base.replaceQueryParam("page", Math.max(totalPages - 1, 0)).toUriString());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", currentPage);
        pagination.put("meta", meta);
        pagination.put("links", links);

        response.put("pagination", pagination);
        return ResponseEntity.ok(response);
    }

    /** 단건 조회(+조회수 증가는 서비스에서 처리) (공개) */
    @GetMapping("/{id}")
    public ResponseEntity<NoticeResponseDto> getNotice(@PathVariable Long id) {
        NoticeResponseDto dto = noticeService.getNotice(id);
        return ResponseEntity.ok()
                .header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
                .header("Pragma", "no-cache")
                .body(dto);
    }

    /** 생성 (관리자 전용) */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> create(@RequestBody @Valid NoticeCreateRequestDto dto) {
        // 서비스에서 SecurityContext로 작성자/감사로그 처리 가능
        Long createdId = noticeService.createNotice(dto); // 서비스가 생성된 id를 반환하도록 권장
        // 서비스가 void라면 아래 Location 생성 없이 201만 내려도 무방합니다.
        if (createdId != null) {
            URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{id}")
                    .buildAndExpand(createdId)
                    .toUri();
            return ResponseEntity.created(location).build(); // 201 Created + Location
        }
        return ResponseEntity.status(201).build(); // createdId를 반환하지 않는 경우
    }

    /** 수정 (관리자 전용) */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @RequestBody @Valid NoticeCreateRequestDto dto) {
        noticeService.updateNotice(id, dto);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    /** 부분 수정 필요 시 (선택) */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> partialUpdate(@PathVariable Long id,
                                              @RequestBody Map<String, Object> patch) {
        // 선택사항: 서비스에서 특정 필드만 업데이트하도록 구현
        noticeService.partialUpdateNotice(id, patch);
        return ResponseEntity.noContent().build();
    }

    /** 삭제 (관리자 전용) */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build(); // 204 No Content
    }
}
