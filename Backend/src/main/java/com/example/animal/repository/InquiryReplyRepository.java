package com.example.animal.repository;

import com.example.animal.entity.InquiryReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryReplyRepository extends JpaRepository<InquiryReply, Long> {
    List<InquiryReply> findByInquiryIdOrderByCreatedAtAsc(Long inquiryId);
    long countByInquiryId(Long inquiryId); // 선택
}
