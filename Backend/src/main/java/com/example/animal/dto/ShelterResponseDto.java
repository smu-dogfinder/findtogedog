package com.example.animal.dto;

import lombok.Data;

import java.util.List;

@Data
public class ShelterResponseDto {
    private Header header;
    private Body body;

    @Data
    public static class Header {
        private String reqNo;
        private String resultCode;
        private String resultMsg;
        private String errorMsg;
    }

    @Data
    public static class Body {
        private Items items;
        private String numOfRows;
        private String pageNo;
        private String totalCount;
    }

    @Data
    public static class Items {
        private List<Item> item;
    }

    @Data
    public static class Item {
        private String dataStdDt;
        private String careNm;
        private String careRegNo;
        private String orgNm;
        private String divisionNm;
        private String saveTrgtAnimal;
        private String careAddr;
        private String jibunAddr;
        private String lat;
        private String lng;
        private String dsignationDate;
        private String weekOprStime;
        private String weekOprEtime;
        private String weekCellStime;
        private String weekCellEtime;
        private String weekendOprStime;
        private String weekendOprEtime;
        private String weekendCellStime;
        private String weekendCellEtime;
        private String closeDay;
        private String vetPersonCnt;
        private String specsPersonCnt;
        private String medicalCnt;
        private String breedCnt;
        private String quarabtineCnt;
        private String feedCnt;
        private String transCarCnt;
        private String careTel;
    }
}
