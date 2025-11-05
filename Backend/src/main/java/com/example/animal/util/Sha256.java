package com.example.animal.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class Sha256 {
    public static String hashWithSalt(String salt, String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update((salt + raw).getBytes(StandardCharsets.UTF_8));
            byte[] digest = md.digest();

            StringBuilder sb = new StringBuilder();
            for (byte b: digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Password hashing failed", e);
        }
    }
}
