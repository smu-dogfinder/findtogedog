package com.example.animal.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class AuthUtil {
    public static String currentUserid() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;

        Object principal = auth.getPrincipal();
        if ("anonymousUser".equals(principal)) return null;

        String name = auth.getName(); // JwtAuthenticationFilter에서 setName(userid) 해두면 여기로 일관 반환
        return (name == null || name.isBlank()) ? null : name;
    }
}

