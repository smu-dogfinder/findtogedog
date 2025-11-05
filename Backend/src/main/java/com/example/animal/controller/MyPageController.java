package com.example.animal.controller;

import com.example.animal.dto.UserDto;
import com.example.animal.dto.UpdateInquiryRequestDto;
import com.example.animal.dto.UpdateLostPetRequestDto;
import com.example.animal.dto.UpdateUserRequestDto;
import com.example.animal.entity.Inquiry;
import com.example.animal.entity.LostPet;
import com.example.animal.service.MyPageService;
import com.example.animal.service.storage.StorageService;  
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;                    
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;                               

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;
    private final StorageService storageService;            

    /* 내 프로필 조회 */
    @GetMapping("/me")
    public ResponseEntity<UserDto> me() {
        return ResponseEntity.ok(myPageService.getUser());
    }

    /* 내 프로필 수정 */
    @PutMapping("/me")
    public ResponseEntity<Void> updateMe(@RequestBody @Valid UpdateUserRequestDto req) {
        myPageService.updateUser(req);
        return ResponseEntity.ok().build();
    }

    /* 내가 쓴 분실신고 목록 */
    @GetMapping("/lost-pets")
    public ResponseEntity<Page<LostPet>> myLostPets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(myPageService.myLostPets(page, size));
    }

    /* 내가 쓴 문의글 목록 */
    @GetMapping("/inquiries")
    public ResponseEntity<Page<Inquiry>> myInquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(myPageService.myInquiries(page, size));
    }

    /* 내 분실신고 글 수정/삭제 */
    @PutMapping("/lost-pets/{id}")
    public ResponseEntity<Void> updateMyLostPet(@PathVariable Long id,
                                                @RequestBody UpdateLostPetRequestDto req) {
        myPageService.updateMyLostPet(id, req);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/lost-pets/{id}")
    public ResponseEntity<Void> deleteMyLostPet(@PathVariable Long id) {
        myPageService.deleteMyLostPet(id);
        return ResponseEntity.noContent().build();
    }

    /* 내 문의글 수정/삭제 */
    @PutMapping("/inquiries/{id}")
    public ResponseEntity<Void> updateMyInquiry(@PathVariable Long id,
                                                @RequestBody UpdateInquiryRequestDto req) {
        myPageService.updateMyInquiry(id, req);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/inquiries/{id}")
    public ResponseEntity<Void> deleteMyInquiry(@PathVariable Long id) {
        myPageService.deleteMyInquiry(id);
        return ResponseEntity.noContent().build();
    }

    /* 이미지 교체 */
    @PutMapping(value = "/lost-pets/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> updateLostPetImage(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        String imagePath = storageService.save(file);            // 저장 후
        myPageService.updateLostPetImagePath(id, imagePath);     // DB의 imagePath 갱신
        return ResponseEntity.ok().build();
    }
}
