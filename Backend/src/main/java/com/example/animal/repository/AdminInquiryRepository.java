package com.example.animal.repository;

import com.example.animal.dto.admin.AdminInquiryRowDto;
import com.example.animal.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminInquiryRepository extends JpaRepository<Inquiry, Long> {

    @Query(value = """
        select new com.example.animal.dto.admin.AdminInquiryRowDto(
            i.id,
            i.title,
            i.isPublic,
            i.createdAt,
            exists (
                select 1
                from InquiryReply r
                where r.inquiry = i
            )
        )
        from Inquiry i
        where i.memberNo.id = :memberNo
        order by i.createdAt desc, i.id desc
        """,
        countQuery = """
        select count(i)
        from Inquiry i
        where i.memberNo.id = :memberNo
        """
    )
    Page<AdminInquiryRowDto> findPagedByMemberNo(@Param("memberNo") Long memberNo, Pageable pageable);

    @Modifying
    @Query("delete from Inquiry i where i.memberNo.id = :memberNo")
    int deleteByMemberNo_Id(@Param("memberNo") Long memberNo);
    
}
