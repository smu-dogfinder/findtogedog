package com.example.animal.controller;

import com.example.animal.dto.admin.*;
import com.example.animal.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    /** 회원 목록 (요약: userId, nickname, 가입일, 문의/신고 수) */
    @GetMapping("/paged")
    public Page<AdminUserSummaryDto> getUsersPaged(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return adminUserService.getUsers(keyword, pageable);
    }

    /** 회원 상세 (기본정보 + 문의/신고 개수 요약) */
    @GetMapping("/{userId}")
    public AdminUserDetailDto getUserDetail(@PathVariable("userId") Long memberNo) {
        return adminUserService.getUserDetail(memberNo);
    }

    /** 해당 회원의 문의글 목록 (페이징) */
    @GetMapping("/{userId}/inquiries")
    public Page<AdminInquiryRowDto> getUserInquiries(
            @PathVariable("userId") Long memberNo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return adminUserService.getUserInquiries(memberNo, pageable);
    }

    /** 해당 회원의 신고글(분실신고) 목록 (페이징) */
    @GetMapping("/{userId}/lost-reports")
    public Page<AdminLostReportRowDto> getUserLostReports(
            @PathVariable("userId") Long memberNo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return adminUserService.getUserLostReports(memberNo, pageable);
    }

    /** 회원 삭제 */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable("userId") Long memberNo) {
        adminUserService.deleteUser(memberNo);
        return ResponseEntity.noContent().build();
    }
}
