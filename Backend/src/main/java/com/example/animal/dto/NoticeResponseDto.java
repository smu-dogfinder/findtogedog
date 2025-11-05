package com.example.animal.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NoticeResponseDto {
    private Integer displayNo;       // ROW_NUMBER()로 붙이는 연속 번호
    private Long id;
    private String title;
    private String content;
    private String author;
    private int views;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
