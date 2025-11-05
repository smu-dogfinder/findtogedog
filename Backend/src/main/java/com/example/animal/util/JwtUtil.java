package com.example.animal.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.*;
import java.util.stream.Collectors;

import com.example.animal.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private Key key;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    /* ===================== 토큰 생성 ===================== */

    /** 권장: role을 포함해 발급(roles 배열 + role 단일 모두 세팅) */
    public String generateAccessToken(String username, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + 1000L * 60 * 15); // 15분

        String springRole = normalizeToSpringRole(role);      // "ADMIN" -> "ROLE_ADMIN"
        String singleRole = stripRolePrefix(springRole);      // "ROLE_ADMIN" -> "ADMIN"

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(exp)
                .claim("typ", "access")
                .claim("role", singleRole)                    // 구(단일) 호환
                .claim("roles", List.of(springRole))          // 신(배열) 권장
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** 호환용: role 미지정 시 USER로 */
    public String generateAccessToken(String username) {
        return generateAccessToken(username, "USER");
    }

    public String generateRefreshToken(String username) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + 1000L * 60 * 60 * 24 * 14); // 14일
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(exp)
                .claim("typ", "refresh")
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** User 엔티티 기반 발급 */
    public String createToken(User user) {
        return generateAccessToken(user.getUserid(), user.getRole());
    }

    /* ===================== 파싱/검증 ===================== */

    public boolean validate(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        Claims c = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
        return "refresh".equals(c.get("typ", String.class));
    }

    public String getUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /* ===================== 역할 조회(구/신 호환) ===================== */

    /** 구호환: 단일 role("ADMIN") 반환. 없으면 null */
    public String getRole(String token) {
        Claims claims = parseClaims(token);
        return claims.get("role", String.class);
    }

    /**
     * 신권장: roles 배열(["ROLE_ADMIN", ...]) 반환.
     * - roles 없으면 role 단일을 읽어 배열로 변환
     * - 모두 없으면 빈 리스트
     */
    @SuppressWarnings("unchecked")
    public List<String> getRoles(String token) {
        Claims claims = parseClaims(token);

        Object raw = claims.get("roles");
        if (raw instanceof Collection<?> col) {
            return col.stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .map(this::normalizeToSpringRole)
                    .distinct()
                    .collect(Collectors.toList());
        }

        String single = claims.get("role", String.class); // "ADMIN"
        if (single != null) {
            return List.of(normalizeToSpringRole(single));
        }
        return List.of();
    }

    /* ===================== 정규화 유틸 ===================== */

    /** "ADMIN" -> "ROLE_ADMIN", null/빈값 -> "ROLE_USER" */
    public String normalizeToSpringRole(String r) {
        if (r == null || r.isBlank()) return "ROLE_USER";
        String up = r.toUpperCase(Locale.ROOT).replace(' ', '_');
        return up.startsWith("ROLE_") ? up : "ROLE_" + up;
    }

    /** "ROLE_ADMIN" -> "ADMIN" */
    public String stripRolePrefix(String r) {
        if (r == null) return null;
        return r.toUpperCase(Locale.ROOT).replaceFirst("^ROLE_", "");
    }
}
