package com.example.animal.controller;

import com.example.animal.config.AppConstants;
import com.example.animal.dto.LostPetCreateRequestDto;
import com.example.animal.dto.LostPetResponseDto;
import com.example.animal.dto.UpdateLostPetRequestDto;
import com.example.animal.service.LostPetService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/lost-pet")
public class LostPetController {

    private final LostPetService lostPetService;

    @Value("${app.upload-root}")
    private String uploadRoot;

    /* ---------- 내부 유틸: 현재 사용자/권한 ---------- */

    private static class AuthInfo {
        final String userid;
        final boolean isAdmin;
        AuthInfo(String userid, boolean isAdmin) {
            this.userid = userid;
            this.isAdmin = isAdmin;
        }
    }

    private AuthInfo currentAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return new AuthInfo(null, false);
        }
        String userid = auth.getName(); // JwtAuthenticationFilter에서 name=userid로 설정되어 있어야 함
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
        return new AuthInfo(userid, isAdmin);
    }

    /* ---------- 목록(페이징) ---------- */

    @GetMapping("/paged")
    public ResponseEntity<Map<String, Object>> getPagedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        AuthInfo ai = currentAuth(); // 로그인 안 했으면 userid=null
        Page<LostPetResponseDto> pageResult = lostPetService.getPostsPaged(page, size, ai.userid);

        Map<String, Object> response = new HashMap<>();
        response.put("data", pageResult.getContent());

        int totalPages = pageResult.getTotalPages();
        int currentPage = pageResult.getNumber() + 1;
        int blockSize = 10;
        int startPage = ((currentPage - 1) / blockSize) * blockSize + 1;
        int endPage = Math.min(startPage + blockSize - 1, totalPages);

        Map<String, Object> meta = new HashMap<>();
        meta.put("itemPerPage", pageResult.getSize());
        meta.put("totalItems", pageResult.getTotalElements());
        meta.put("currentPage", currentPage);
        meta.put("totalPages", totalPages);
        meta.put("startPage", startPage);
        meta.put("endPage", endPage);

        String baseUrl = request.getRequestURL().toString();
        Map<String, String> links = new HashMap<>();
        links.put("first", baseUrl + "?page=0&size=" + size);
        links.put("previous", baseUrl + "?page=" + Math.max(page - 1, 0) + "&size=" + size);
        links.put("current", baseUrl + "?page=" + page + "&size=" + size);
        links.put("next", baseUrl + "?page=" + Math.min(page + 1, Math.max(totalPages - 1, 0)) + "&size=" + size);
        links.put("last", baseUrl + "?page=" + Math.max(totalPages - 1, 0) + "&size=" + size);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("meta", meta);
        pagination.put("links", links);

        response.put("pagination", pagination);
        return ResponseEntity.ok(response);
    }

    /* ---------- 상세 ---------- */

    @GetMapping("/{id}")
    public ResponseEntity<LostPetResponseDto> getPostById(@PathVariable Long id) {
        AuthInfo ai = currentAuth();
        return lostPetService.getPostById(id, ai.userid, ai.isAdmin)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* ---------- 생성 ---------- */

     @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LostPetResponseDto> create(
            @ModelAttribute LostPetCreateRequestDto req,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication  // JwtAuthenticationFilter에서 세팅
    ) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String userId = authentication.getName(); // 여기서 userid 추출
        LostPetResponseDto dto = lostPetService.createPost(req, image, userId, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /* ---------- 수정(본문/이미지 함께) ---------- */

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LostPetResponseDto> updatePost(
            @PathVariable Long id,
            @ModelAttribute UpdateLostPetRequestDto req
    ) {
        AuthInfo ai = currentAuth();
        if (ai.userid == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        // 서비스는 Optional<LostPetResponseDto> 반환 가정
        return lostPetService.updatePost(id, req, ai.userid, ai.isAdmin)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }


    /* ---------- 삭제 ---------- */

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        AuthInfo ai = currentAuth();
        if (ai.userid == null) return ResponseEntity.status(401).build();

        boolean deleted = lostPetService.deletePost(id, ai.userid, ai.isAdmin);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(403).build();
    }

    /* ---------- 이미지 스트리밍 ---------- */

    @GetMapping("/images/**")
    public ResponseEntity<Resource> getImageFlexible(HttpServletRequest request) throws Exception {
        String fullPath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String relativePath = new AntPathMatcher().extractPathWithinPattern("/api/lost-pet/images/**", fullPath);

        String decodedPath = URLDecoder.decode(relativePath, StandardCharsets.UTF_8);
        decodedPath = decodedPath.replace('\\', '/');
        if (decodedPath.startsWith("/")) decodedPath = decodedPath.substring(1);
        if (decodedPath.contains("..")) {
            return ResponseEntity.badRequest().build();
        }

        String fileName = decodedPath;
        if (decodedPath.startsWith(AppConstants.LOST_PET_WEB_PREFIX)) {
            fileName = decodedPath.substring(AppConstants.LOST_PET_WEB_PREFIX.length());
        }

        return serveImage(fileName);
    }

    private ResponseEntity<Resource> serveImage(String fileName) throws Exception {
        Path root = Path.of(uploadRoot).toAbsolutePath().normalize();
        Path file = root.resolve(fileName).normalize();

        if (!file.startsWith(root) || !Files.exists(file)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(file.toUri());
        String contentType = Files.probeContentType(file);
        if (!StringUtils.hasText(contentType)) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        CacheControl cacheControl = CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic();
        String encodedName = URLEncoder.encode(file.getFileName().toString(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setCacheControl(cacheControl.getHeaderValue());
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedName);

        return ResponseEntity.ok().headers(headers).body(resource);
    }
}
