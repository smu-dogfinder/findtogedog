package com.example.animal.dto.admin;

import lombok.*;

import java.time.LocalDateTime;

@Getter
public class AdminUserDetailDto {
    private final Long id;
    private final String userid;
    private final String nickname;
    private final String email;
    private final String role;
    private final LocalDateTime createdAt;
    private final long inquiryCount;
    private final long lostReportCount;

    public AdminUserDetailDto(Long id, String userid, String nickname, String email, String role,
                              LocalDateTime createdAt, long inquiryCount, long lostReportCount) {
        this.id = id;
        this.userid = userid;
        this.nickname = nickname;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
        this.inquiryCount = inquiryCount;
        this.lostReportCount = lostReportCount;
    }
    // getters ...
}
