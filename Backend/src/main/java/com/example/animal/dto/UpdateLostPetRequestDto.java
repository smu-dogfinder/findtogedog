package com.example.animal.dto;

import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateLostPetRequestDto {

    private String dogName;
    private String content;
    private String species;

    // 프론트는 "암컷"/"수컷" 전송 → 서비스에서 매핑
    private String gender;

    private String placeLost;

    // multipart(@ModelAttribute) 바인딩용
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateLost;

    private String phone;

    // ★ 파일 필드명은 프론트의 formData.append('image', ...) 와 동일해야 함
    private MultipartFile image;   // 선택 업로드(없으면 null)

    private Boolean removeImage;
}
