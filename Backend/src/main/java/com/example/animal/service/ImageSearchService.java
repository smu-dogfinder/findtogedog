package com.example.animal.service;

import com.example.animal.dto.DogDetailsDto;
import com.example.animal.dto.SimilarDogResponseDto;
import com.example.animal.dto.SimilarDogResultDto;
import com.example.animal.entity.DogDetails;
import com.example.animal.repository.DogDetailsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.InputStream;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageSearchService {

    @Value("${ai.base-url}")
    private String aiBaseUrl;

    private final DogDetailsRepository dogDetailsRepository;

    // 기능 1: 유사 유기견 검색 + 필터링 검색어 검색
    // 기존 시그니처 유지(호환) — 필요 없으면 제거 가능
    public SimilarDogResponseDto searchSimilarDogsOnly(MultipartFile imageFile) {
        Map<String, Object> aiResponse = requestToAiServer(imageFile, "uploaded");

        List<SimilarDogResultDto> parsed = parseResults(aiResponse);
        if (parsed.isEmpty()) {
            SimilarDogResponseDto empty = new SimilarDogResponseDto();
            empty.setDogs(Collections.emptyList());
            return empty;
        }

        // rank 보존용 맵
        Map<Long, Integer> rankMap = parsed.stream()
                .collect(Collectors.toMap(SimilarDogResultDto::getId, SimilarDogResultDto::getRank));

        // DB에서 한 번에 가져오기
        List<Long> ids = parsed.stream().map(SimilarDogResultDto::getId).toList();
        List<DogDetails> dogs = dogDetailsRepository.findByIdIn(ids);

        // AI rank 기준으로 정렬
        dogs.sort(Comparator.comparingInt(d -> rankMap.getOrDefault(d.getId(), Integer.MAX_VALUE)));

        SimilarDogResponseDto result = new SimilarDogResponseDto();
        result.setDogs(dogs.stream().map(DogDetailsDto::fromEntity).toList());
        return result;
    }


    // 기능 2: 유사 유기견 + 성견 이미지
    public SimilarDogResponseDto searchSimilarDogsWithGeneratedImage(MultipartFile imageFile) {
        Map<String, Object> aiResponse = requestToAiServer(imageFile, "generated");

        List<SimilarDogResultDto> parsed = parseResults(aiResponse);

        List<Long> ids = parsed.stream().map(SimilarDogResultDto::getId).toList();
        Map<Long, Integer> rankMap = parsed.stream().collect(Collectors.toMap(
                SimilarDogResultDto::getId, SimilarDogResultDto::getRank));

        List<DogDetails> dogs = dogDetailsRepository.findByIdIn(ids);
        dogs.sort(Comparator.comparingInt(d -> rankMap.getOrDefault(d.getId(), Integer.MAX_VALUE)));

        String imageBase64 = aiResponse.get("image").toString();

        SimilarDogResponseDto result = new SimilarDogResponseDto();
        result.setDogs(dogs.stream().map(DogDetailsDto::fromEntity).toList());
        result.setGeneratedImageBase64(imageBase64);

        return result;
    }

    // AI 요청: 기능별로 엔드포인트 선택
    private Map<String, Object> requestToAiServer(MultipartFile imageFile, String mode) {
        
        String aiUrl = aiBaseUrl + "/search/" + mode;

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        try {
            body.add("image", new MultipartInputStreamFileResource(
                    imageFile.getInputStream(), imageFile.getOriginalFilename()));
        } catch (IOException e) {
            throw new RuntimeException("이미지 처리 실패", e);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                aiUrl, HttpMethod.POST, requestEntity, new ParameterizedTypeReference<>() {}
        );

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || !responseBody.containsKey("results")) {
            throw new RuntimeException("AI 응답이 비어있거나 잘못되었습니다.");
        }

        return responseBody;
    }

    // AI 결과 파싱
    @SuppressWarnings("unchecked")
    private List<SimilarDogResultDto> parseResults(Map<String, Object> responseBody) {
        Object resultRaw = responseBody.get("results");
        if (!(resultRaw instanceof List<?> resultList)) {
            throw new RuntimeException("AI 응답 results 형식 오류: " + resultRaw);
        }

        return resultList.stream()
                .filter(item -> item instanceof Map)
                .map(item -> {
                    Map<String, Object> map = (Map<String, Object>) item;
                    SimilarDogResultDto dto = new SimilarDogResultDto();
                    dto.setId(Long.valueOf(map.get("id").toString()));
                    dto.setRank((Integer) map.get("rank"));
                    dto.setSimilarity(Double.parseDouble(map.get("similarity").toString()));
                    return dto;
                })
                .toList();
    }

    // MultipartFile을 InputStream으로 감싸는 리소스 클래스
    static class MultipartInputStreamFileResource extends InputStreamResource {
        private final String filename;
        public MultipartInputStreamFileResource(InputStream inputStream, String filename) {
            super(inputStream);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return this.filename;
        }

        @Override
        public long contentLength() {
            return -1;
        }
    }
}

