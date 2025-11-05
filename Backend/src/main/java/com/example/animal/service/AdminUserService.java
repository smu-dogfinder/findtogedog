package com.example.animal.service;

import com.example.animal.dto.admin.*;
import com.example.animal.entity.User;
import com.example.animal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final AdminInquiryRepository adminInquiryRepository;
    private final AdminLostReportRepository adminLostReportRepository;
    private final UserRepository userRepository;

    /** 회원 목록(요약) */
    public Page<AdminUserSummaryDto> getUsers(String keyword, Pageable pageable) {
        return adminUserRepository.findAdminUserSummaries(keyword, pageable);
    }

    /** 회원 상세 */
    public AdminUserDetailDto getUserDetail(Long memberNo) {
        AdminUserDetailDto dto = adminUserRepository.findAdminUserDetail(memberNo);
        if (dto == null) throw new IllegalArgumentException("존재하지 않는 회원입니다. id=" + memberNo);
        return dto;
    }

    /** 해당 회원의 문의글 목록 */
    public Page<AdminInquiryRowDto> getUserInquiries(Long memberNo, Pageable pageable) {
        return adminInquiryRepository.findPagedByMemberNo(memberNo, pageable);
    }

    /** 해당 회원의 분실신고 목록 */
    public Page<AdminLostReportRowDto> getUserLostReports(Long memberNo, Pageable pageable) {
        return adminLostReportRepository.findPagedByMemberNo(memberNo, pageable);
    }

    /** 회원 삭제(캐스케이드/오팬리무벌 사용 시: 자식 자동 삭제) */
    @Transactional
    public void deleteUser(Long memberNo) {
        User user = userRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다. id=" + memberNo));
        userRepository.delete(user);
    }
}
