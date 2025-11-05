package com.example.animal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.animal.dto.ShelterApiResponseWrapper;
import com.example.animal.dto.ShelterResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.InputStream;
import java.io.IOException;

import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShelterProxyService {

    @Value("${openapi.shelter.service-key}")
    private String serviceKey;

    @Value("${openapi.shelter.url}")
    private String apiUrl;

    public ResponseEntity<?> getShelterData(int page, int size) {
        HttpURLConnection connection = null;
        InputStream stream = null;
        String result = null;

        try {
            // 🔒 serviceKey는 인코딩하지 않습니다
            // 📌 기타 파라미터는 인코딩 필요 없음 (숫자, 영문자)
            StringBuilder requestUrl = new StringBuilder(apiUrl);
            requestUrl.append("?serviceKey=").append(serviceKey);
            requestUrl.append("&MobileOS=ETC");
            requestUrl.append("&MobileApp=LostDogApp");
            requestUrl.append("&_type=json");
            requestUrl.append("&pageNo=").append(page);
            requestUrl.append("&numOfRows=").append(size);

            System.out.println("[DEBUG] Final URL: " + requestUrl);

            // 💬 URL 객체 생성 및 연결
            URI uri = new URI(requestUrl.toString());
            URL url = uri.toURL(); 
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");

            int responseCode = connection.getResponseCode();
            System.out.println("[DEBUG] HTTP Response Code: " + responseCode);

            if (responseCode == 200) {
                stream = connection.getInputStream();
                result = readStream(stream);
                return ResponseEntity.ok(result);  // JSON 문자열 그대로 반환
            } else {
                stream = connection.getErrorStream();
                result = readStream(stream);
                System.err.println("[공공API 오류] 응답 코드: " + responseCode);
                System.err.println(result);
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body("공공API 오류 발생:\n" + result);
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("요청 처리 중 예외 발생: " + e.getMessage());
        } finally {
            if (stream != null) try { stream.close(); } catch (IOException ignored) {}
            if (connection != null) connection.disconnect();
        }
    }

    // 🔁 InputStream → String 변환 메서드
    private String readStream(InputStream stream) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            sb.append(line).append("\n");
        }
        br.close();
        return sb.toString();
    }

    public ResponseEntity<?> getShelterDataFiltered(int page, int size, String orgNm, String search) {
        try {
            // 🔁 기존 getShelterData에서 가져온 JSON 문자열을 재사용
            ResponseEntity<?> rawResponse = getShelterData(page, size);
            if (!(rawResponse.getBody() instanceof String rawJson)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("예상치 못한 응답 형식입니다.");
            }

            ObjectMapper mapper = new ObjectMapper();
            ShelterApiResponseWrapper wrapper = mapper.readValue(rawJson, ShelterApiResponseWrapper.class);
            ShelterResponseDto response = wrapper.getResponse();

            List<ShelterResponseDto.Item> items = response.getBody().getItems().getItem();

            if (orgNm != null && !orgNm.isBlank()) {
                items = items.stream()
                        .filter(i -> i.getOrgNm() != null && i.getOrgNm().contains(orgNm))
                        .collect(Collectors.toList());
            }

            if (search != null && !search.isBlank()) {
                String keyword = search.toLowerCase();
                items = items.stream()
                        .filter(i ->
                                (i.getCareNm() != null && i.getCareNm().toLowerCase().contains(keyword)) ||
                                (i.getOrgNm() != null && i.getOrgNm().toLowerCase().contains(keyword)) ||
                                (i.getCareAddr() != null && i.getCareAddr().toLowerCase().contains(keyword))
                        )
                        .collect(Collectors.toList());
            }

            response.getBody().getItems().setItem(items);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "필터링 중 예외 발생", "message", e.getMessage()));
        }
    }
}
