package com.example.animal.repository;

import com.example.animal.entity.DogDetails;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DogDetailsRepository extends JpaRepository<DogDetails, Long> {

    boolean existsByNumber(String number);

    Page<DogDetails> findAllByOrderByFoundDateDesc(Pageable pageable);

    @Query("SELECT DISTINCT d.species FROM DogDetails d WHERE d.species IS NOT NULL")
    List<String> findDistinctSpecies();

    List<DogDetails> findByIdIn(List<Long> ids);

    @Query("""
        SELECT d FROM DogDetails d
        WHERE (:jurisd IS NULL OR d.jurisd LIKE CONCAT('%', :jurisd, '%'))
            AND (:species IS NULL OR d.species LIKE CONCAT('%', :species, '%'))
            AND (
                    :keyword IS NULL OR
                    d.number LIKE CONCAT('%', :keyword, '%') OR
                    d.color LIKE CONCAT('%', :keyword, '%') OR
                    d.state LIKE CONCAT('%', :keyword, '%') OR
                    d.species LIKE CONCAT('%', :keyword, '%')
            )
        """)
    Page<DogDetails> searchByConditionsPaged(
        @Param("jurisd") String jurisd,
        @Param("species") String species,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    /* === 새로 추가: 후보 id + 선택 필터 동시 적용 (AI 연동 전용) === */
    @Query("""
        SELECT d FROM DogDetails d
        WHERE d.id IN :ids
          AND (:jurisd IS NULL OR d.jurisd LIKE CONCAT('%', :jurisd, '%'))
          AND (:species IS NULL OR d.species LIKE CONCAT('%', :species, '%'))
          AND (
                :keyword IS NULL OR
                d.number LIKE CONCAT('%', :keyword, '%') OR
                d.color LIKE CONCAT('%', :keyword, '%') OR
                d.state LIKE CONCAT('%', :keyword, '%') OR
                d.species LIKE CONCAT('%', :keyword, '%') OR
                d.foundLocation LIKE CONCAT('%', :keyword, '%')
          )
        """)
    List<DogDetails> findByIdInWithFilters(
        @Param("ids") List<Long> ids,
        @Param("species") String species,
        @Param("jurisd") String jurisd,
        @Param("keyword") String keyword
    );

}
