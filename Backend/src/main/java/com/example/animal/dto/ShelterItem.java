package com.example.animal.dto;

import lombok.Data;

@Data
public class ShelterItem {
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
