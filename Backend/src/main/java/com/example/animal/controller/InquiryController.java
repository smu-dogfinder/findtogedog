package com.example.animal.controller;

import com.example.animal.dto.InquiryCreateRequestDto;
import com.example.animal.dto.InquiryListItemDto;
import com.example.animal.dto.InquiryResponseDto;
import com.example.animal.dto.UpdateInquiryRequestDto;
import com.example.animal.service.InquiryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    /** 현재 인증 정보에서 userid와 isAdmin을 안전하게 추출 */
    private static class AuthInfo {
        final String userid;
        final boolean isAdmin;
        AuthInfo(String userid, boolean isAdmin) {
            this.userid = userid;
            this.isAdmin = isAdmin;
        }
    }

    private AuthInfo currentAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return new AuthInfo(null, false);
        }
        // JwtAuthenticationFilter에서 setAuthentication 시 name=userid 로 세팅되어 있다고 가정
        String userid = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
        return new AuthInfo(userid, isAdmin);
    }

    // 문자열을 안전하게 정수로 변환 (실패 시 fallback 반환)
    private int safeParseInt(String s, int fallback) {
        if (s == null || s.isBlank()) return fallback;
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    /** 페이징 목록 조회 (닉네임은 항상 노출, 제목은 비공개면 "비공개글") */
    @GetMapping("/paged")
    public ResponseEntity<Map<String, Object>> getPaged(
            // 문자열로 받아서 숫자 변환 실패 시에도 400이 발생하지 않도록 처리
            @RequestParam(name = "page", required = false) String pageParam,   // 1-기반 기대
            @RequestParam(name = "size", required = false) String sizeParam,
            @RequestParam(name = "limit", required = false) String limitParam,
            HttpServletRequest request
    ) {
        // 1) page: 1-기반 입력 → 0-기반 내부
        int page1Based = safeParseInt(pageParam, 1);
        if (page1Based < 1) page1Based = 1;
        final int page0Based = page1Based - 1;

        // 2) size 결정: limit > size > 10 우선순위, 최소 1, 상한 100(필요시 조정)
        Integer sizeCandidate = null;
        Integer limitCandidate = null;

        int parsedSize = safeParseInt(sizeParam, -1);
        if (parsedSize > 0) sizeCandidate = parsedSize;

        int parsedLimit = safeParseInt(limitParam, -1);
        if (parsedLimit > 0) limitCandidate = parsedLimit;

        int decided = (limitCandidate != null) ? limitCandidate
                    : (sizeCandidate  != null) ? sizeCandidate
                    : 10;

        if (decided < 1) decided = 10;
        if (decided > 100) decided = 100; // 과도한 페이지 크기 방지 (상한선은 정책에 맞게 조정)
        final int size = decided;

        // 3) 인증 정보
        AuthInfo ai = currentAuth();

        // 4) 서비스 호출
        Page<InquiryListItemDto> pageResult = inquiryService.getPaged(page0Based, size, ai.isAdmin);

        // 5) 응답 페이징 메타 (1-기반으로 노출)
        Map<String, Object> response = new HashMap<>();
        response.put("data", pageResult.getContent());

        int totalPages  = pageResult.getTotalPages();
        int currentPage = pageResult.getNumber() + 1; // 1-기반
        int blockSize   = 10;
        int startPage   = ((currentPage - 1) / blockSize) * blockSize + 1;
        int endPage     = Math.min(startPage + blockSize - 1, totalPages);

        Map<String, Object> meta = new HashMap<>();
        meta.put("itemPerPage", pageResult.getSize());
        meta.put("totalItems", pageResult.getTotalElements());
        meta.put("currentPage", currentPage);
        meta.put("totalPages", totalPages);
        meta.put("startPage", startPage);
        meta.put("endPage", endPage);

        String baseUrl = request.getRequestURL().toString();
        // 총 페이지가 0일 수 있으므로 링크 계산도 방어적으로
        int safeTotalPages = Math.max(totalPages, 1);
        int prevPage = Math.max(currentPage - 1, 1);
        int nextPage = Math.min(currentPage + 1, safeTotalPages);

        Map<String, String> links = new HashMap<>();
        links.put("first",   baseUrl + "?page=1&size=" + size);
        links.put("previous",baseUrl + "?page=" + prevPage + "&size=" + size);
        links.put("current", baseUrl + "?page=" + currentPage + "&size=" + size);
        links.put("next",    baseUrl + "?page=" + nextPage + "&size=" + size);
        links.put("last",    baseUrl + "?page=" + safeTotalPages + "&size=" + size);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("meta", meta);
        pagination.put("links", links);
        response.put("pagination", pagination);

        return ResponseEntity.ok(response);
    }

    /** 단건 조회 (비공개면 작성자/관리자만 열람) */
    @GetMapping("/{id}")
    public ResponseEntity<InquiryResponseDto> getById(@PathVariable Long id) {
        AuthInfo ai = currentAuth(); // 비로그인도 가능 → userid=null, isAdmin=false
        return ResponseEntity.ok(inquiryService.getById(id, ai.userid, ai.isAdmin));
    }

    /** 글 작성 (로그인 필수) */
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<InquiryResponseDto> createInquiry(
            @RequestBody @Valid InquiryCreateRequestDto req,
            HttpServletRequest request
    ) {
        AuthInfo ai = currentAuth();
        InquiryResponseDto body = inquiryService.createInquiry(ai.userid, req);
        URI location = URI.create(request.getRequestURL().append("/").append(body.getId()).toString());
        return ResponseEntity.created(location).body(body);
    }

    /** 글 수정 (본인 또는 관리자) */
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    public ResponseEntity<InquiryResponseDto> update(
            @PathVariable Long id,
            @RequestBody @Valid UpdateInquiryRequestDto req
    ) {
        AuthInfo ai = currentAuth();
        return ResponseEntity.ok(inquiryService.updateInquiry(id, ai.userid, req, ai.isAdmin));
    }

    /** 글 삭제 (본인 또는 관리자) */
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        AuthInfo ai = currentAuth();
        inquiryService.deleteInquiry(id, ai.userid, ai.isAdmin);
        return ResponseEntity.noContent().build();
    }
}
