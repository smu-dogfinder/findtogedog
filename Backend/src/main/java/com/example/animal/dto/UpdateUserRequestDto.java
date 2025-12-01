package com.example.animal.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUserRequestDto {
    private String nickname;
    private String email;
    private String newPassword; // null/빈문자면 비번 변경 안 함
}

