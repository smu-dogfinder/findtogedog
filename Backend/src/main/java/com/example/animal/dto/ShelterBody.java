package com.example.animal.dto;

import lombok.Data;

@Data
public class ShelterBody {
    private ShelterItems items;
    private String numOfRows;
    private String pageNo;
    private String totalCount;
}
