package com.vdt.flowpilot.workflow.service;

import com.vdt.flowpilot.auth.dto.UserDto;
import com.vdt.flowpilot.auth.service.AuthService;
import com.vdt.flowpilot.bpmn.adapter.BpmnAdapter;
import com.vdt.flowpilot.bpmn.dto.DeploymentResult;
import com.vdt.flowpilot.bpmn.generator.BpmnXmlGenerator;
import com.vdt.flowpilot.common.exception.BusinessException;
import com.vdt.flowpilot.common.exception.ResourceNotFoundException;
import com.vdt.flowpilot.workflow.dto.*;
import com.vdt.flowpilot.workflow.entity.WorkflowDefinition;
import com.vdt.flowpilot.workflow.entity.WorkflowStep;
import com.vdt.flowpilot.workflow.entity.WorkflowFormField;
import com.vdt.flowpilot.workflow.repository.WorkflowDefinitionRepository;
import com.vdt.flowpilot.workflow.repository.WorkflowStepRepository;
import com.vdt.flowpilot.workflow.repository.WorkflowFormFieldRepository;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkflowService {

    private final WorkflowDefinitionRepository workflowRepository;
    private final WorkflowStepRepository stepRepository;
    private final WorkflowFormFieldRepository workflowFormFieldRepository;
    private final BpmnXmlGenerator bpmnXmlGenerator;
    private final BpmnAdapter bpmnAdapter;
    private final AuthService authService;

    public WorkflowService(WorkflowDefinitionRepository workflowRepository,
                           WorkflowStepRepository stepRepository,
                           WorkflowFormFieldRepository workflowFormFieldRepository,
                           BpmnXmlGenerator bpmnXmlGenerator,
                           BpmnAdapter bpmnAdapter,
                           AuthService authService) {
        this.workflowRepository = workflowRepository;
        this.stepRepository = stepRepository;
        this.workflowFormFieldRepository = workflowFormFieldRepository;
        this.bpmnXmlGenerator = bpmnXmlGenerator;
        this.bpmnAdapter = bpmnAdapter;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public List<WorkflowDefinitionDto> getAllWorkflows() {
        return workflowRepository.findAll().stream()
                .map(this::mapToWorkflowDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkflowDefinitionDto getWorkflowById(Long id) {
        WorkflowDefinition workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workflow với id " + id));
        return mapToWorkflowDto(workflow);
    }

    @Transactional
    public WorkflowDefinitionDto createWorkflow(CreateWorkflowRequest request) {
        if (workflowRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Mã workflow đã tồn tại: " + request.getCode());
        }

        UserDto user = authService.getCurrentUser();
        String processKey = request.getBpmnProcessKey() != null ? request.getBpmnProcessKey() : request.getCode();

        WorkflowDefinition workflow = WorkflowDefinition.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .bpmnProcessKey(processKey)
                .status("DRAFT")
                .version(1)
                .createdBy(user.getUsername())
                .build();

        workflow = workflowRepository.save(workflow);
        return mapToWorkflowDto(workflow);
    }

    @Transactional
    public WorkflowDefinitionDto updateWorkflow(Long id, CreateWorkflowRequest request) {
        WorkflowDefinition workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workflow với id " + id));

        if (!workflow.getCode().equals(request.getCode()) && workflowRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Mã workflow đã tồn tại: " + request.getCode());
        }

        workflow.setCode(request.getCode());
        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        if (request.getBpmnProcessKey() != null) {
            workflow.setBpmnProcessKey(request.getBpmnProcessKey());
        }
        workflow.setStatus("DRAFT");

        workflow = workflowRepository.save(workflow);
        return mapToWorkflowDto(workflow);
    }

    @Transactional
    public void deleteWorkflow(Long id) {
        if (!workflowRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy workflow với id " + id);
        }
        workflowRepository.deleteById(id);
    }

    @Transactional
    public WorkflowDefinitionDto addStep(Long id, CreateStepRequest request) {
        WorkflowDefinition workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workflow với id " + id));

        boolean duplicateStepKey = workflow.getSteps().stream()
                .anyMatch(step -> step.getStepKey().equals(request.getStepKey()));
        if (duplicateStepKey) {
            throw new BusinessException("Step key đã tồn tại trong workflow này: " + request.getStepKey());
        }

        WorkflowStep step = WorkflowStep.builder()
                .workflow(workflow)
                .stepKey(request.getStepKey())
                .stepName(request.getStepName())
                .stepType(request.getStepType())
                .assigneeRole(request.getAssigneeRole())
                .orderIndex(request.getOrderIndex())
                .configJson(request.getConfigJson())
                .build();

        stepRepository.save(step);
        workflow.getSteps().add(step);
        workflow.setStatus("DRAFT");
        return mapToWorkflowDto(workflowRepository.save(workflow));
    }

    @Transactional
    public WorkflowDefinitionDto updateStep(Long id, Long stepId, CreateStepRequest request) {
        WorkflowStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bước workflow với id " + stepId));

        if (!step.getWorkflow().getId().equals(id)) {
            throw new BusinessException("Bước này không thuộc workflow đã chọn");
        }

        boolean duplicateStepKey = step.getWorkflow().getSteps().stream()
                .anyMatch(existing -> !existing.getId().equals(stepId) && existing.getStepKey().equals(request.getStepKey()));
        if (duplicateStepKey) {
            throw new BusinessException("Step key đã tồn tại trong workflow này: " + request.getStepKey());
        }

        step.setStepKey(request.getStepKey());
        step.setStepName(request.getStepName());
        step.setStepType(request.getStepType());
        step.setAssigneeRole(request.getAssigneeRole());
        step.setOrderIndex(request.getOrderIndex());
        step.setConfigJson(request.getConfigJson());

        stepRepository.save(step);
        WorkflowDefinition workflow = step.getWorkflow();
        workflow.setStatus("DRAFT");
        workflowRepository.save(workflow);
        return getWorkflowById(id);
    }

    @Transactional
    public WorkflowDefinitionDto deleteStep(Long id, Long stepId) {
        WorkflowStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bước workflow với id " + stepId));

        if (!step.getWorkflow().getId().equals(id)) {
            throw new BusinessException("Bước này không thuộc workflow đã chọn");
        }

        WorkflowDefinition workflow = step.getWorkflow();
        workflow.getSteps().removeIf(existing -> existing.getId().equals(stepId));
        stepRepository.delete(step);
        workflow.setStatus("DRAFT");
        workflowRepository.save(workflow);
        return getWorkflowById(id);
    }

    @Transactional(readOnly = true)
    public String previewBpmnXml(Long id) {
        WorkflowDefinition workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workflow với id " + id));
        return bpmnXmlGenerator.generateBpmnXml(workflow);
    }

    @Transactional
    public WorkflowDefinitionDto deployWorkflow(Long id) {
        WorkflowDefinition workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workflow với id " + id));

        if (workflow.getSteps().isEmpty()) {
            throw new BusinessException("Không thể deploy workflow chưa có bước xử lý");
        }

        String bpmnXml = bpmnXmlGenerator.generateBpmnXml(workflow);
        String processKey = workflow.getBpmnProcessKey() != null ? workflow.getBpmnProcessKey() : workflow.getCode();

        try {
            DeploymentResult result = bpmnAdapter.deployProcess(processKey, bpmnXml);
            workflow.setDeploymentId(result.getId());
            workflow.setStatus("DEPLOYED");
            workflow.setVersion(workflow.getVersion() + 1);
            workflow = workflowRepository.save(workflow);
        } catch (Exception e) {
            throw new BusinessException("Deploy process lên BPMN engine thất bại: " + e.getMessage());
        }

        return mapToWorkflowDto(workflow);
    }

    private WorkflowDefinitionDto mapToWorkflowDto(WorkflowDefinition workflow) {
        return WorkflowDefinitionDto.builder()
                .id(workflow.getId())
                .code(workflow.getCode())
                .name(workflow.getName())
                .description(workflow.getDescription())
                .version(workflow.getVersion())
                .status(workflow.getStatus())
                .bpmnProcessKey(workflow.getBpmnProcessKey())
                .deploymentId(workflow.getDeploymentId())
                .createdBy(workflow.getCreatedBy())
                .createdAt(workflow.getCreatedAt())
                .updatedAt(workflow.getUpdatedAt())
                .steps(workflow.getSteps().stream().map(this::mapToStepDto).collect(Collectors.toList()))
                .formFields(workflow.getFormFields() != null ? workflow.getFormFields().stream().map(this::mapToFormFieldDto).collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }

    private WorkflowStepDto mapToStepDto(WorkflowStep step) {
        return WorkflowStepDto.builder()
                .id(step.getId())
                .stepKey(step.getStepKey())
                .stepName(step.getStepName())
                .stepType(step.getStepType())
                .assigneeRole(step.getAssigneeRole())
                .orderIndex(step.getOrderIndex())
                .configJson(step.getConfigJson())
                .createdAt(step.getCreatedAt())
                .updatedAt(step.getUpdatedAt())
                .build();
    }

    private WorkflowFormFieldDto mapToFormFieldDto(WorkflowFormField field) {
        return WorkflowFormFieldDto.builder()
                .id(field.getId())
                .fieldKey(field.getFieldKey())
                .fieldLabel(field.getFieldLabel())
                .fieldType(field.getFieldType())
                .required(field.isRequired())
                .optionsJson(field.getOptionsJson())
                .defaultValue(field.getDefaultValue())
                .validationJson(field.getValidationJson())
                .orderIndex(field.getOrderIndex())
                .sensitive(field.isSensitive())
                .createdAt(field.getCreatedAt())
                .updatedAt(field.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<WorkflowFormFieldDto> getFormFields(Long workflowId) {
        WorkflowDefinition workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workflow với id " + workflowId));
        return workflow.getFormFields().stream()
                .map(this::mapToFormFieldDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkflowDefinitionDto addFormField(Long workflowId, CreateFormFieldRequest request) {
        WorkflowDefinition workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workflow với id " + workflowId));

        WorkflowFormField field = WorkflowFormField.builder()
                .workflow(workflow)
                .fieldKey(request.getFieldKey())
                .fieldLabel(request.getFieldLabel())
                .fieldType(request.getFieldType())
                .required(request.isRequired())
                .optionsJson(request.getOptionsJson())
                .defaultValue(request.getDefaultValue())
                .validationJson(request.getValidationJson())
                .orderIndex(request.getOrderIndex())
                .sensitive(request.isSensitive())
                .build();

        workflowFormFieldRepository.save(field);
        workflow.getFormFields().add(field);
        return mapToWorkflowDto(workflowRepository.save(workflow));
    }

    @Transactional
    public WorkflowDefinitionDto updateFormField(Long workflowId, Long fieldId, CreateFormFieldRequest request) {
        WorkflowFormField field = workflowFormFieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy trường form với id " + fieldId));

        if (!field.getWorkflow().getId().equals(workflowId)) {
            throw new BusinessException("Trường form này không thuộc workflow đã chọn");
        }

        field.setFieldKey(request.getFieldKey());
        field.setFieldLabel(request.getFieldLabel());
        field.setFieldType(request.getFieldType());
        field.setRequired(request.isRequired());
        field.setOptionsJson(request.getOptionsJson());
        field.setDefaultValue(request.getDefaultValue());
        field.setValidationJson(request.getValidationJson());
        field.setOrderIndex(request.getOrderIndex());
        field.setSensitive(request.isSensitive());

        workflowFormFieldRepository.save(field);
        return getWorkflowById(workflowId);
    }

    @Transactional
    public WorkflowDefinitionDto deleteFormField(Long workflowId, Long fieldId) {
        WorkflowFormField field = workflowFormFieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy trường form với id " + fieldId));

        if (!field.getWorkflow().getId().equals(workflowId)) {
            throw new BusinessException("Trường form này không thuộc workflow đã chọn");
        }

        workflowFormFieldRepository.delete(field);
        return getWorkflowById(workflowId);
    }

    @Transactional(readOnly = true)
    public List<WorkflowDefinitionDto> getAvailableWorkflows() {
        return workflowRepository.findByStatus("DEPLOYED").stream()
                .map(this::mapToWorkflowDto)
                .collect(Collectors.toList());
    }

}
