package com.example.animal.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 문의 답변 응답 DTO
 * - 선택지 A(애플리케이션 동기화) 보안 필수 반영:
 *   1) 비공개(isPublic=false)이고 열람 권한이 없는 경우, content를 절대 노출하지 않음(null 처리)
 *   2) JSON 직렬화 시 isPublic 필드명 안정화(@JsonProperty("isPublic"))
 *   3) 프론트에 불필요한 내부 식별자(memberNo 등) 노출 없음
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InquiryReplyResponseDto {

    /** 답변 PK */
    private Long id;

    /** 소속 문의 PK */
    private Long inquiryId;

    /** 관리자(답변자) 사용자 PK (프론트 요구사항에 맞게 유지) */
    private Long adminUserId;

    /** 관리자 닉네임 (표시용) */
    private String adminNickname;

    /** 답변 본문 (권한 없으면 null) */
    private String content;

    /** 공개 여부 (직렬화 명 고정) */
    @JsonProperty("isPublic")
    private Boolean isPublic;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 권한에 따라 content 노출을 제어하는 안전한 팩토리.
     *
     * @param id             답변 PK
     * @param inquiryId      소속 문의 PK
     * @param adminUserId    관리자 사용자 PK(또는 필요 시 null)
     * @param adminNickname  관리자 닉네임
     * @param rawContent     원본 답변 내용
     * @param isPublic       공개 여부
     * @param createdAt      생성 시각
     * @param updatedAt      수정 시각
     * @param canViewContent 이 답변의 내용을 볼 권한이 있는지(작성자/관리자 등)
     * @return 보안 규칙을 적용한 DTO
     */
    public static InquiryReplyResponseDto of(
            Long id,
            Long inquiryId,
            Long adminUserId,
            String adminNickname,
            String rawContent,
            Boolean isPublic,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            boolean canViewContent
    ) {
        final boolean expose = Boolean.TRUE.equals(isPublic) || canViewContent;
        return InquiryReplyResponseDto.builder()
                .id(id)
                .inquiryId(inquiryId)
                .adminUserId(adminUserId)
                .adminNickname(adminNickname)
                .content(expose ? rawContent : null) // 🔒 비공개 & 권한 없음 → 내용 미노출
                .isPublic(isPublic)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    /**
     * 퍼블릭 뷰(권한 없음)의 안전한 변환 헬퍼.
     * - isPublic=true일 때만 content 노출
     */
    public static InquiryReplyResponseDto publicView(
            Long id,
            Long inquiryId,
            Long adminUserId,
            String adminNickname,
            String rawContent,
            Boolean isPublic,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        return of(id, inquiryId, adminUserId, adminNickname, rawContent, isPublic, createdAt, updatedAt, false);
    }

    /**
     * 작성자/관리자 뷰(권한 있음)의 변환 헬퍼.
     * - content 항상 노출
     */
    public static InquiryReplyResponseDto ownerOrAdminView(
            Long id,
            Long inquiryId,
            Long adminUserId,
            String adminNickname,
            String rawContent,
            Boolean isPublic,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        return of(id, inquiryId, adminUserId, adminNickname, rawContent, isPublic, createdAt, updatedAt, true);
    }
}
