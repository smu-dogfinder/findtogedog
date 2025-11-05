package com.example.animal.repository;

import com.example.animal.dto.admin.AdminLostReportRowDto;
import com.example.animal.entity.LostPet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminLostReportRepository extends JpaRepository<LostPet, Long> {

    @Query(value = """
        select new com.example.animal.dto.admin.AdminLostReportRowDto(
          l.id,
          l.species,
          l.gender,
          l.createdAt,
          l.dateLost
        )
        from LostPet l
        where l.memberNo.id = :memberNo
        order by l.createdAt desc, l.id desc
        """,
        countQuery = """
        select count(l)
        from LostPet l
        where l.memberNo.id = :memberNo
        """
    )
    Page<AdminLostReportRowDto> findPagedByMemberNo(@Param("memberNo") Long memberNo, Pageable pageable);

    @Modifying
    @Query("delete from LostPet l where l.memberNo.id = :memberNo")
    int deleteByMemberNo_Id(@Param("memberNo") Long memberNo);
}
