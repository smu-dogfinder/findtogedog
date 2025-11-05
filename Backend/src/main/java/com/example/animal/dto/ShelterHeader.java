package com.example.animal.dto;

import lombok.Data;

@Data
public class ShelterHeader {
    private String reqNo;
    private String resultCode;
    private String resultMsg;
    private String errorMsg;
}
