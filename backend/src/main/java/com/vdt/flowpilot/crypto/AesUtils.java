package com.vdt.flowpilot.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class AesUtils {

    private static SecretKeySpec secretKey;

    @Value("${app.crypto.secret}")
    public void setSecretKey(String secret) {
        byte[] keyBytes = new byte[16];
        byte[] inputBytes = secret.getBytes(StandardCharsets.UTF_8);
        System.arraycopy(inputBytes, 0, keyBytes, 0, Math.min(inputBytes.length, 16));
        secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * Encrypts plain text using AES.
     */
    public static String encrypt(String strToEncrypt) {
        try {
            if (strToEncrypt == null) return null;
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            return Base64.getEncoder().encodeToString(cipher.doFinal(strToEncrypt.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting data: " + e.getMessage(), e);
        }
    }

    /**
     * Decrypts encrypted text using AES.
     */
    public static String decrypt(String strToDecrypt) {
        try {
            if (strToDecrypt == null) return null;
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            return new String(cipher.doFinal(Base64.getDecoder().decode(strToDecrypt)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting data: " + e.getMessage(), e);
        }
    }
}
