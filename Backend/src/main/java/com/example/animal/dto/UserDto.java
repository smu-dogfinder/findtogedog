package com.example.animal.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserDto {
    private Long id;
    private String userid;
    private String nickname;
    private String email;
    private String role;
    private String createdAt; // 문자열 포맷(yyyy-MM-dd HH:mm:ss)로 내려주려면 Service에서 포맷팅해서 채워줘
}

