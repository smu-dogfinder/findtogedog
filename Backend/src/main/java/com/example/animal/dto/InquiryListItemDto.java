package com.example.animal.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor @Builder
public class InquiryListItemDto {
    private Integer displayNo;        // 추가: 연속 번호 (작성 순)
    private Long id;
    private String title;             // 일반: 비공개글 마스킹, 관리자: 원제목
    private String nickname;
    private LocalDateTime createdAt;
    private Boolean answered;
}

