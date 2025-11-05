package com.example.animal.dto.projection;

import java.time.LocalDateTime;

public interface NoticeRowProjection {
    Integer getDisplayNo();
    Long getId();
    String getTitle();
    String getContent();
    String getAuthor();
    Integer getViews();
    LocalDateTime getCreatedAt();
    LocalDateTime getUpdatedAt();
}

