package com.vdt.flowpilot.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateFormFieldRequest {
    @NotBlank(message = "Field key is required")
    private String fieldKey;

    @NotBlank(message = "Field label is required")
    private String fieldLabel;

    @NotBlank(message = "Field type is required")
    private String fieldType; // TEXT, NUMBER, DATE, BOOLEAN, SELECT, TEXTAREA

    private boolean required;
    private String optionsJson;
    private String defaultValue;
    private String validationJson;

    @NotNull(message = "Order index is required")
    private Integer orderIndex;

    private boolean sensitive;
}
