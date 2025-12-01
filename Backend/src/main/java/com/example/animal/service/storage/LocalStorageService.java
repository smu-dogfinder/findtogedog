package com.example.animal.service.storage;

import com.example.animal.config.AppConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private final Path uploadRoot;

    public LocalStorageService(@Value("${app.upload-root}") String uploadRootPath) throws IOException {
        this.uploadRoot = Paths.get(uploadRootPath).toAbsolutePath().normalize();
        if (!Files.exists(this.uploadRoot)) {
            Files.createDirectories(this.uploadRoot);
        }
    }

    @Override
    public String save(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains(".")) ?
                original.substring(original.lastIndexOf('.')) : "";
        String filename = UUID.randomUUID() + ext;
        Path target = uploadRoot.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // DB에는 웹 경로 저장
        return "/" + AppConstants.LOST_PET_WEB_PREFIX + filename;
    }
}
