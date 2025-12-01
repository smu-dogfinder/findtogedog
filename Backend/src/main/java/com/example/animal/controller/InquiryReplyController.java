package com.example.animal.controller;

import com.example.animal.dto.InquiryReplyRequestDto;
import com.example.animal.dto.InquiryReplyResponseDto;
import com.example.animal.service.InquiryReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/inquiries/{inquiryId}/replies")
@RequiredArgsConstructor
public class InquiryReplyController {

    private final InquiryReplyService inquiryReplyService;

    // 생성 (관리자)
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<InquiryReplyResponseDto> create(@PathVariable Long inquiryId,
                                                          @RequestBody InquiryReplyRequestDto req,
                                                          Principal principal) {
        String userid = principal.getName(); // Jwt 필터에서 세팅한 userid
        return ResponseEntity.ok(inquiryReplyService.create(inquiryId, req, userid));
    }

    // 목록 (비공개 규칙 반영)
    @GetMapping
    public ResponseEntity<List<InquiryReplyResponseDto>> list(@PathVariable Long inquiryId,
                                                              Principal principal) {
        String useridOrNull = (principal == null) ? null : principal.getName();
        return ResponseEntity.ok(inquiryReplyService.list(inquiryId, useridOrNull));
    }

    // 수정 (관리자)
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{replyId}")
    public ResponseEntity<InquiryReplyResponseDto> update(@PathVariable Long inquiryId,
                                                          @PathVariable Long replyId,
                                                          @RequestBody InquiryReplyRequestDto req,
                                                          Principal principal) {
        String userid = principal.getName();
        return ResponseEntity.ok(inquiryReplyService.update(inquiryId, replyId, req, userid));
    }

    // 삭제 (관리자)
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{replyId}")
    public ResponseEntity<Void> delete(@PathVariable Long inquiryId,
                                       @PathVariable Long replyId,
                                       Principal principal) {
        String userid = principal.getName();
        inquiryReplyService.delete(inquiryId, replyId, userid);
        return ResponseEntity.noContent().build();
    }
}
