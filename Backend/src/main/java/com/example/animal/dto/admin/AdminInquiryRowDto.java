package com.example.animal.dto.admin;

import lombok.Getter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@ToString
public class AdminInquiryRowDto {
    private final Long id;
    private final String title;
    private final Boolean isPublic;
    private final LocalDateTime createdAt;
    private final boolean answered;

    public AdminInquiryRowDto(Long id, String title, Boolean isPublic, LocalDateTime createdAt, boolean answered) {
        this.id = id;
        this.title = title;
        this.isPublic = isPublic;
        this.createdAt = createdAt;
        this.answered = answered;
    }
    // getters ...
}
