package com.example.animal.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateInquiryRequestDto {
    private String title;
    private String content;
    private Boolean isPublic;
}
