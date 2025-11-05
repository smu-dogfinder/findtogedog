package com.example.animal.repository;

import com.example.animal.dto.admin.AdminUserDetailDto;
import com.example.animal.dto.admin.AdminUserSummaryDto;
import com.example.animal.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminUserRepository extends JpaRepository<User, Long> {

    /** 회원 목록(요약) — 문의/신고 수를 memberNo(FK) 기준으로 집계 */
    @Query(value = """
        select new com.example.animal.dto.admin.AdminUserSummaryDto(
            u.id, u.userid, u.nickname, u.createdAt,
            (select count(i) from Inquiry i where i.memberNo.id = u.id),
            (select count(l) from LostPet l where l.memberNo.id = u.id)
        )
        from User u
        where (:kw is null or :kw = ''
               or u.userid like concat('%', :kw, '%')
               or u.nickname like concat('%', :kw, '%'))
        order by u.createdAt desc, u.id desc
        """,
        countQuery = """
        select count(u)
        from User u
        where (:kw is null or :kw = ''
               or u.userid like concat('%', :kw, '%')
               or u.nickname like concat('%', :kw, '%'))
        """
    )
    Page<AdminUserSummaryDto> findAdminUserSummaries(@Param("kw") String keyword, Pageable pageable);

    /** 회원 상세 — 각 글 개수를 memberNo(FK) 기준으로 집계 */
    @Query("""
        select new com.example.animal.dto.admin.AdminUserDetailDto(
            u.id, 
            u.userid, 
            u.nickname, 
            u.email,
            u.role,
            u.createdAt,
            (select count(i) from Inquiry i where i.memberNo.id = u.id),
            (select count(l) from LostPet l where l.memberNo.id = u.id)
        )
        from User u
        where u.id = :memberNo
        """)
    AdminUserDetailDto findAdminUserDetail(@Param("memberNo") Long memberNo);
}
