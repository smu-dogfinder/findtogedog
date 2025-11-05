package com.example.animal.security;

import com.example.animal.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final String[] PUBLIC_ALWAYS = { "/auth/**" };

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        final String method = request.getMethod();
        final String path = request.getRequestURI();

        if ("OPTIONS".equalsIgnoreCase(method)) return true;
        for (String p : PUBLIC_ALWAYS) {
            if (pathMatcher.match(p, path)) return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        // 이미 인증된 요청이면 패스
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        try {
            if (!jwtUtil.validate(token)) {
                log.debug("JWT invalid by validate()");
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            final String principal = jwtUtil.getUsername(token); // userid(or subject)
            if (principal == null || principal.isBlank()) {
                log.debug("JWT subject (username) missing");
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            // 1) roles 배열 시도
            List<String> roles = safeList(jwtUtil.getRoles(token));

            // 2) 단일 role 클레임 폴백
            if (roles.isEmpty()) {
                String singleRole = jwtUtil.getRole(token); // "ADMIN" or "ROLE_ADMIN"
                if (singleRole != null && !singleRole.isBlank()) {
                    roles = List.of(singleRole);
                }
            }

            // 3) ROLE_ 정규화 + 권한 부여
            List<GrantedAuthority> authorities = roles.stream()
                    .map(r -> normalizeRole(r))
                    .filter(Objects::nonNull)
                    .distinct()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            // (옵션) 아무 권한도 없을 때 USER로 폴백하고 싶다면 주석 해제
            // if (authorities.isEmpty()) {
            //     authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
            // }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("JWT authenticated. principal={}, authorities={}", principal, authorities);
            logAuthSnapshot("after setAuthentication");

        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        } catch (JwtException e) {
            log.warn("JWT invalid (signature/format): {}", e.getMessage());
            SecurityContextHolder.clearContext();
        } catch (Exception e) {
            log.error("JWT filter unexpected error", e);
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }

    /** ROLE_ 접두사 정규화 + 대문자화 */
    private String normalizeRole(String raw) {
        if (raw == null) return null;
        String r = raw.trim();
        if (r.isEmpty()) return null;
        r = r.toUpperCase(Locale.ROOT);
        return r.startsWith("ROLE_") ? r : "ROLE_" + r;
    }

    /** null/공백 제거한 안전 리스트 */
    private List<String> safeList(List<String> in) {
        if (in == null) return Collections.emptyList();
        return in.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** 인증 직후 SecurityContext 내용을 보기 좋은 형식으로 출력 */
    private void logAuthSnapshot(String phase) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            log.info("[로그:{}] SecurityContext 인증 객체 확인: 인증 정보 없음 (auth == null)", phase);
            return;
        }
        String authorities = (auth.getAuthorities() == null)
                ? "[]"
                : auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.joining(", "));
        log.info("[로그:{}] SecurityContext 인증 객체 확인:\n  ▶인증 여부: {}\n  ▶Principal: {}\n  ▶Name(userid): {}\n  ▶권한 목록: [{}]",
                phase,
                auth.isAuthenticated(),
                auth.getPrincipal(),
                auth.getName(),
                authorities
        );
    }
}
