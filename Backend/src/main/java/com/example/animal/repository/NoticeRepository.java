package com.example.animal.repository;

import com.example.animal.dto.projection.NoticeRowProjection;
import com.example.animal.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // ==========================
    // 검색 관련 메서드 (JPA)
    // ==========================
    Page<Notice> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);
    Page<Notice> findByContentContainingIgnoreCase(String keyword, Pageable pageable);
    Page<Notice> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String titleKeyword, String contentKeyword, Pageable pageable);

    // 최신순 정렬 (선택 사용 가능)
    Page<Notice> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);

    // ==========================
    // 조회수 증가
    // ==========================
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notice n SET n.views = n.views + 1 WHERE n.id = :id")
    int incrementViews(@Param("id") Long id);

    /**
     * 키워드 없음 목록:
     * - displayNo는 과거→현재(ASC) 기준 전역 번호를 CTE에서 계산
     * - 화면 정렬/페이징은 최신글 우선(DESC)
     * (MySQL 8 이상 필요: 윈도우 함수/CTE)
     */
    @Query(value = """
        WITH base AS (
            SELECT
                ROW_NUMBER() OVER (ORDER BY n.created_at ASC, n.id ASC) AS displayNo,
                n.id          AS id,
                n.title       AS title,
                n.content     AS content,
                n.author      AS author,
                n.views       AS views,
                n.created_at  AS createdAt,
                n.updated_at  AS updatedAt
            FROM notice n
        )
        SELECT displayNo, id, title, content, author, views, createdAt, updatedAt
        FROM base
        ORDER BY createdAt DESC, id DESC
        LIMIT :size OFFSET :offset
        """, nativeQuery = true)
    List<NoticeRowProjection> findPagedWithRowNewestFirst(@Param("size") int size, @Param("offset") int offset);

    @Query(value = "SELECT COUNT(*) FROM notice", nativeQuery = true)
    long countAllForList();
}
