package com.example.animal.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true) // 과다 바인딩 방지(오버포스팅 완화)
public class InquiryCreateRequestDto {

    @NotBlank
    @Size(max = 200)           // DB: title varchar(200)
    private String title;

    @NotBlank                  // DB: TEXT, 내용 필수
    private String content;

    @NotNull                   // 체크박스 값 그대로 수신
    private Boolean isPublic;
}
