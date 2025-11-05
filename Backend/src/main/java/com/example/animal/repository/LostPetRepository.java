package com.example.animal.repository;

import com.example.animal.entity.LostPet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LostPetRepository extends JpaRepository<LostPet, Long> {

    /** 내가 쓴 분실신고 목록: userid(문자열 스냅샷) 기준 + Pageable 정렬 */
    Page<LostPet> findByUserid(String userid, Pageable pageable);          // ← 변경

    /** 본인 글 단건 조회(수정/삭제 권한 확인): userid(문자열 스냅샷) 기준 */
    Optional<LostPet> findByIdAndUserid(Long id, String userid);          // ← 변경

    /** (관리자 등에서 필요 시) 연관 사용자 PK로 조회: member_no → user.id(FK) 기준 */
    Optional<LostPet> findByIdAndMemberNo_Id(Long id, Long memberId);

    // 필요하다면 엔터티 자체로도 가능:
    // Optional<LostPet> findByIdAndMemberNo(Long id, User memberNo);
}
