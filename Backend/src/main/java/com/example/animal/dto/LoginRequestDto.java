package com.example.animal.dto;

import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequestDto {
  @NotBlank private String userid;
  @NotBlank private String password;
}

