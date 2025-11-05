package com.example.animal.repository;

import com.example.animal.entity.Inquiry;
import com.example.animal.dto.projection.InquiryListRowProjection;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

      /** 목록: displayNo는 오래된 글부터 1번, 출력은 최신순 */
    @Query(value = """
      SELECT
        t.displayNo,
        t.id,
        t.title,
        t.nickname,
        t.createdAt,
        t.answered,
        t.isPublic
      FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY i.created_at ASC, i.id ASC)          AS displayNo,
          i.id                                                             AS id,
          i.title                                                          AS title,
          i.nickname                                                       AS nickname,
          i.created_at                                                     AS createdAt,
          EXISTS (SELECT 1 FROM inquiry_reply r WHERE r.inquiry_id = i.id) AS answered,
          i.is_public                                                      AS isPublic
        FROM inquiry i
      ) t
      ORDER BY t.createdAt DESC, t.id DESC   
      LIMIT :#{#pageable.pageSize} OFFSET :#{#pageable.offset}
      """,
      countQuery = "SELECT COUNT(*) FROM inquiry i",
      nativeQuery = true
    )
    Page<InquiryListRowProjection> findPagedAllAscWithNo(Pageable pageable);

    /** 공개글 단건 */
    Optional<Inquiry> findByIdAndIsPublicTrue(Long id);

    /** 소유자 검증(로그인 ID 경로 탐색: memberNo.userid) */
    Optional<Inquiry> findByIdAndMemberNo_Userid(Long id, String userid);

    /** 내가 쓴 글 (회원 PK 기준) */
    Page<Inquiry> findByMemberNo_Id(Long userId, Pageable pageable);

    /** 내가 쓴 글 (스냅샷 userid 기준) */
    Page<Inquiry> findByUserid(String userid, Pageable pageable);
}
