package com.example.animal.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class LostPetCreateRequestDto {

    @Size(max = 50)            // DB: dog_name varchar(50)
    private String dogName;

    // DB: content TINYTEXT/TEXT — 길이 제한은 DB와 정책에 맞춰 선택
    private String content;

    @Size(max = 50)            // DB: species varchar(50) (※현재 엔티티 100이라면 DB 정합성 점검)
    private String species;

    @Size(max = 10)            // DB: gender varchar(10)
    private String gender;

    @Size(max = 100)           // DB: place_lost varchar(100)
    private String placeLost;

    @NotNull(message = "분실일은 필수입니다.")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) // "YYYY-MM-DD"
    private LocalDate dateLost;

    @Size(max = 20)            // DB: phone varchar(20)
    // @Pattern(...)            // 필요 시 휴대전화 포맷 정규식 추가
    private String phone;

    // imagePath는 서버에서 Multipart 처리/저장 시 DTO에 포함하지 않음
}
