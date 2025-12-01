package com.example.animal.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NoticeCreateRequestDto {
    private String title;
    private String content;
    private String author; // 로그인 기능 연동 시 자동 입력 가능
}
