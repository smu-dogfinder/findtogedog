package com.example.animal.dto.projection;

import java.time.LocalDateTime;

public interface InquiryListRowProjection {

    Integer getDisplayNo();
    Long getId();
    String getTitle();          // 원제목(마스킹은 서비스에서)
    String getNickname();
    String getUserId();         // AS userId
    LocalDateTime getCreatedAt();
    Integer getAnswered();      // AS answered (CASE WHEN EXISTS(...) THEN TRUE ELSE FALSE END)
    Boolean getIsPublic();      // AS isPublic
}