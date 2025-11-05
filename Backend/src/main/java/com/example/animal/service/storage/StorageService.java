package com.example.animal.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface StorageService {
    /** 파일을 저장하고 접근 경로(또는 전체 경로)를 반환 */
    String save(MultipartFile file) throws IOException;
}
