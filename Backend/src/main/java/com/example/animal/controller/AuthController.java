package com.example.animal.controller;

import com.example.animal.dto.LoginRequestDto;
import com.example.animal.dto.SignupRequestDto;
import com.example.animal.entity.RefreshToken;
import com.example.animal.entity.User;
import com.example.animal.repository.RefreshTokenRepository;
import com.example.animal.repository.UserRepository;
import com.example.animal.service.UserService;
import com.example.animal.util.JwtUtil;
import com.example.animal.util.TokenHash;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RefreshTokenRepository refreshTokenRepository;

    /* ====== 쿠키 속성 ====== */
    @Value("${app.cookie.name:refresh_token}")
    private String rtCookieName;

    @Value("${app.cookie.secure:false}")     // dev: false, prod(ngrok/https): true
    private boolean rtCookieSecure;

    @Value("${app.cookie.same-site:Lax}")    // dev: Lax, prod: None
    private String rtCookieSameSite;

    @Value("${app.cookie.path:/}")
    private String rtCookiePath;

    @Value("${app.cookie.max-age-seconds:1209600}") // 14 days
    private long rtCookieMaxAge;

    private ResponseCookie buildRtCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(rtCookieName, token)
                .httpOnly(true)
                .secure(rtCookieSecure)
                .sameSite(rtCookieSameSite)
                .path(rtCookiePath)
                .maxAge(maxAgeSeconds)
                .build();
    }

    private ResponseCookie buildRtDeleteCookie() {
        return ResponseCookie.from(rtCookieName, "")
                .httpOnly(true)
                .secure(rtCookieSecure)
                .sameSite(rtCookieSameSite)
                .path(rtCookiePath)
                .maxAge(0)
                .build();
    }

    /** 회원가입 */
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@Valid @RequestBody SignupRequestDto dto) {
        userService.signup(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "success",
                "statusCode", 201,
                "message", "CREATED"
        ));
    }

    /** 로그인: Access 발급 + Refresh(닉네임 기준) 업서트 + 쿠키 세팅 */
    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto dto, HttpServletResponse res) {
        // 1) 인증
        userService.login(dto);

        // 2) 사용자 조회
        User user = userService.findByUserid(dto.getUserid());

        // 3) Access(roles 포함) — subject는 userid 유지(프론트 인증 헤더에 보통 userid 사용)
        String accessToken = jwtUtil.generateAccessToken(user.getUserid(), user.getRole());

        // 4) Refresh — **subject를 nickname으로 발급** (DB refresh_token과 일치)
        String nickname = user.getNickname();
        String refreshToken = jwtUtil.generateRefreshToken(nickname);
        String hash = TokenHash.sha256(refreshToken);

        // 5) 업서트(닉네임 1행 정책)
        Optional<RefreshToken> existing = refreshTokenRepository.findByNickname(nickname);
        if (existing.isPresent()) {
            RefreshToken rt = existing.get();
            rt.setTokenHash(hash);
            rt.setExpiresAt(LocalDateTime.now().plusDays(14));
            rt.setRevoked(false);
            // JPA dirty checking → 자동 업데이트
        } else {
            refreshTokenRepository.save(
                    RefreshToken.builder()
                            .tokenHash(hash)
                            .nickname(nickname)
                            .expiresAt(LocalDateTime.now().plusDays(14))
                            .revoked(false)
                            .build()
            );
        }

        // 6) 쿠키
        res.addHeader("Set-Cookie", buildRtCookie(refreshToken, rtCookieMaxAge).toString());

        Map<String, Object> userData = Map.of(
                "id", user.getId(),
                "userid", user.getUserid(),
                "nickName", user.getNickname(),
                "role", user.getRole()
        );

        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "user", userData
        ));
    }

    /** 아이디 중복 체크 */
    @PostMapping("/check-id")
    public ResponseEntity<?> checkDuplicateId(@RequestBody Map<String, String> body) {
        String userid = body.get("userid");
        boolean exists = userRepository.existsByUserid(userid);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    /** 닉네임 중복 체크 */
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname) {
        boolean isAvailable = !userRepository.existsByNickname(nickname);
        return ResponseEntity.ok(isAvailable);
    }

    /** 이메일 중복 체크 */
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmail(@RequestParam String email) {
        boolean isAvailable = !userRepository.existsByEmail(email);
        return ResponseEntity.ok(isAvailable);
    }

    /** Access 재발급(Refresh 회전) — nickname 기준 */
    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<?> refresh(
            HttpServletRequest req,
            HttpServletResponse res,
            @RequestHeader(value = "X-Refresh-Token", required = false) String refreshFromHeader
    ) {
        String refresh = extractCookie(req, rtCookieName);
        if (refresh == null) refresh = refreshFromHeader;
        if (refresh == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No refresh token"));
        }

        if (!jwtUtil.validate(refresh) || !jwtUtil.isRefreshToken(refresh)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid refresh token"));
        }

        // 토큰 해시 존재/만료/철회 여부 확인
        String tokenHash = TokenHash.sha256(refresh);
        Optional<RefreshToken> found = refreshTokenRepository.findByTokenHash(tokenHash)
                .filter(t -> !t.isRevoked() && t.getExpiresAt().isAfter(LocalDateTime.now()));
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Refresh not found/revoked/expired"));
        }

        // **subject=nickname** 으로 가정
        String nickname = jwtUtil.getUsername(refresh);

        // 사용자 조회(역할 확보) — 닉네임 기준
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new IllegalStateException("User not found for refresh"));

        // 새 Access(roles 포함) — subject는 여전히 userid 사용
        String newAccess = jwtUtil.generateAccessToken(user.getUserid(), user.getRole());

        // 회전: 기존 row 업데이트(동일 row 재사용)
        RefreshToken current = found.get();
        current.setRevoked(true); // 혹은 덮어쓰기 전에 revoke
        // 새 refresh 발급(닉네임 subject)
        String newRefresh = jwtUtil.generateRefreshToken(nickname);
        current.setTokenHash(TokenHash.sha256(newRefresh));
        current.setExpiresAt(LocalDateTime.now().plusDays(14));
        current.setRevoked(false);
        // save 불필요(Dirty checking) — 필요 시 명시 save(current);

        // 쿠키 갱신
        res.addHeader("Set-Cookie", buildRtCookie(newRefresh, rtCookieMaxAge).toString());

        return ResponseEntity.ok(Map.of("accessToken", newAccess));
    }

    /** 로그아웃: revoke + 쿠키 제거 */
    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<?> logout(
            HttpServletRequest req,
            HttpServletResponse res,
            @RequestHeader(value = "X-Refresh-Token", required = false) String refreshFromHeader) {

        String refresh = extractCookie(req, rtCookieName);
        if (refresh == null) refresh = refreshFromHeader;

        if (refresh != null) {
            refreshTokenRepository.findByTokenHash(TokenHash.sha256(refresh))
                    .ifPresent(rt -> rt.setRevoked(true));
        }

        res.addHeader("Set-Cookie", buildRtDeleteCookie().toString());

        // 과거 path="/auth"로 내려간 쿠키 정리 필요 시 추가
        ResponseCookie deleteAuthPath = ResponseCookie.from(rtCookieName, "")
                .httpOnly(true)
                .secure(rtCookieSecure)
                .sameSite(rtCookieSameSite)
                .path("/auth")
                .maxAge(0)
                .build();
        res.addHeader("Set-Cookie", deleteAuthPath.toString());

        return ResponseEntity.ok().build();
    }

    /* ====== 유틸 ====== */
    private String extractCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
