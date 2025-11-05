package com.example.animal.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class InquiryReplyRequestDto {

    @NotBlank                   // 빈 답변 방지
    private String content;

    // null이면 서비스에서 기본 true로 처리
    private Boolean isPublic;
}
