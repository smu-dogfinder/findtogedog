package com.example.animal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SignupRequestDto {
  @NotBlank private String nickname;
  @NotBlank private String userid;
  @NotBlank private String password;
  @Email @NotBlank private String email;
}

