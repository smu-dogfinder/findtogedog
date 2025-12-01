package com.example.animal.service;

import com.example.animal.dto.LoginRequestDto;
import com.example.animal.dto.SignupRequestDto;
import com.example.animal.entity.User;
import com.example.animal.exception.DuplicateUserException;
import com.example.animal.exception.UnauthorizedException;
import com.example.animal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;

import com.example.animal.util.JwtUtil;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public void signup(SignupRequestDto dto) {
        if (userRepository.existsByUserid(dto.getUserid())) {
            throw new DuplicateUserException("이미 존재하는 ID입니다.");
        }
        if (userRepository.existsByNickname(dto.getNickname())) {
            throw new DuplicateUserException("이미 존재하는 닉네임입니다.");
        }

        String salt = generateSalt();
        String hashedPassword = hashPassword(salt, dto.getPassword());

        User user = User.builder()
            .nickname(dto.getNickname())
            .userid(dto.getUserid())
            .email(dto.getEmail())
            .salt(salt)
            .password(hashedPassword)
            .role("USER")
            .createdAt(LocalDateTime.now())
            .build();

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User findByUserid(String userid) {
        return userRepository.findByUserid(userid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userid));
    }


    public String login(LoginRequestDto dto) {
       User user = userRepository.findByUserid(dto.getUserid())
            .orElseThrow(() -> new UnauthorizedException("존재하지 않는 사용자입니다."));

        String encrypted = hashPassword(user.getSalt(), dto.getPassword());
        if (!encrypted.equals(user.getPassword())) {
            throw new UnauthorizedException("비밀번호가 일치하지 않습니다.");
        }

        return jwtUtil.createToken(user); 
    }


    private String generateSalt() {
        byte[] salt = new byte[32];
        new SecureRandom().nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    private String hashPassword(String salt, String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update((salt + password).getBytes(StandardCharsets.UTF_8));
            return bytesToHex(md.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

}


