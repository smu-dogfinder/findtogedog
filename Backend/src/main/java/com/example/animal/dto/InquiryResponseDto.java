package com.example.animal.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class InquiryResponseDto {
    private Long id;
    private String title;
    private String content;      // 목록에서는 null일 수 있음
    private String nickname;     // 화면 표시용(항상 공개)
    private Boolean isPublic;    // 응답은 박싱형으로
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

