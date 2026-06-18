package com.vdt.flowpilot.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class SensitiveDataConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return AesUtils.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return AesUtils.decrypt(dbData);
    }
}
