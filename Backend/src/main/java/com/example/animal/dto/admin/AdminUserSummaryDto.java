package com.example.animal.dto.admin;

import lombok.*;

import java.time.LocalDateTime;

@Getter
public class AdminUserSummaryDto {
     
    private final Long id;
    private final String userid;     // 로그인 ID
    private final String nickname;
    private final LocalDateTime createdAt;
    private final long inquiryCount;     // 문의글 수
    private final long lostReportCount;  // 신고글 수

    public AdminUserSummaryDto(Long id, String userid, String nickname, LocalDateTime createdAt,
                               long inquiryCount, long lostReportCount) {
        this.id = id;
        this.userid = userid;
        this.nickname = nickname;
        this.createdAt = createdAt;
        this.inquiryCount = inquiryCount;
        this.lostReportCount = lostReportCount;
    }
}
