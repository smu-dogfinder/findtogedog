package com.example.animal.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.example.animal.security.JwtAuthenticationFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 0) 정적 리소스/루트(선택) -------------------------------
                .requestMatchers("/", "/favicon.ico", "/assets/**", "/static/**").permitAll()

                // 1) CORS preflight --------------------------------------
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 2) 공개 인증/헬스체크 -----------------------------------
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // 3) 공개 GET(조회) ----------------------------------------
                .requestMatchers(HttpMethod.GET, "/api/inquiries/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/notices/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/dog-details/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/shelters", "/api/shelters/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/lost-pet", "/api/lost-pet/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/lost-pet/images/**").permitAll()

                // 4) 공개 POST (AI 검색 등) --------------------------------
                .requestMatchers(HttpMethod.POST, "/api/search/image").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/search/generated").permitAll()

                // 5) 마이페이지는 인증 필요 --------------------------------
                .requestMatchers("/api/mypage/**").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // 6) 문의글: 작성/수정/삭제는 로그인 (서비스에서 본인/관리자 검사)
                .requestMatchers(HttpMethod.POST,   "/api/inquiries/**").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/api/inquiries/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/inquiries/**").authenticated()

                // 7) 신고글: 작성/수정/삭제는 로그인 (서비스에서 본인/관리자 검사)
                .requestMatchers(HttpMethod.POST,   "/api/lost-pet", "/api/lost-pet/**").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/api/lost-pet", "/api/lost-pet/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/lost-pet", "/api/lost-pet/**").authenticated()

                // 8) 관리자 답변(문의글) 정책 -------------------------------
                .requestMatchers(HttpMethod.GET,    "/api/inquiries/*/replies").permitAll()
                .requestMatchers(HttpMethod.POST,   "/api/inquiries/*/replies").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/api/inquiries/*/replies/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/inquiries/*/replies/*").hasRole("ADMIN")

                // 9) 공지 CRUD = 관리자 전용 (경로를 더 좁게) ---------------
                .requestMatchers(HttpMethod.POST,   "/api/notices").hasRole("ADMIN")      // 생성
                .requestMatchers(HttpMethod.PUT,    "/api/notices/*").hasRole("ADMIN")    // 수정
                .requestMatchers(HttpMethod.PATCH,  "/api/notices/*").hasRole("ADMIN")    // 부분수정
                .requestMatchers(HttpMethod.DELETE, "/api/notices/*").hasRole("ADMIN")    // 삭제

                // 10) 나머지는 인증 필요 -----------------------------------
                .anyRequest().authenticated()
            )
            // 일관된 JSON 에러 응답
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"status\":\"error\",\"statusCode\":401,\"message\":\"UNAUTHORIZED\"}");
                })
                .accessDeniedHandler((req, res, e) -> {
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"status\":\"error\",\"statusCode\":403,\"message\":\"FORBIDDEN\"}");
                })
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .httpBasic(b -> b.disable())
            .formLogin(f -> f.disable())
            .logout(l -> l.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 프론트 오리진(개발/테스트용)
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5175",
            "https://*.ngrok-free.app"
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "ngrok-skip-browser-warning"
        ));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        // (선택) 생성 후 Location 헤더 등을 프론트에서 읽어야 한다면 노출
        // config.setExposedHeaders(List.of("Location"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
