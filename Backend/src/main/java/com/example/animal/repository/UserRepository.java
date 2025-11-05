package com.example.animal.repository;

import com.example.animal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUserid(String userid); // 고유 여부 검사
    boolean existsByNickname(String nickname);
    boolean existsByEmail(String email);   
    Optional<User> findByUserid(String userid); // 로그인도 userid 기준

    Optional<User> findByNickname(String nickname);
}
