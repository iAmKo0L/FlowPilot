package com.vdt.flowpilot.bpmn.adapter;

import com.vdt.flowpilot.bpmn.dto.*;
import com.vdt.flowpilot.common.exception.BusinessException;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class CibSevenAdapter implements BpmnAdapter {

    private final RestTemplate restTemplate;

    @Value("${app.bpmn.engine-url}")
    private String engineUrl;

    public CibSevenAdapter(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    @Retry(name = "bpmnEngine")
    public DeploymentResult deployProcess(String processKey, String bpmnXml) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("deployment-name", processKey);
        body.add("enable-duplicate-filtering", "true");
        body.add("deploy-changed-only", "true");

        ByteArrayResource resource = new ByteArrayResource(bpmnXml.getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return processKey + ".bpmn";
            }
        };
        body.add("data", resource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(engineUrl + "/deployment/create", requestEntity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> responseBody = response.getBody();
                String id = (String) responseBody.get("id");
                String name = (String) responseBody.get("name");
                return DeploymentResult.builder().id(id).name(name).build();
            }
            throw new BusinessException("Failed to deploy workflow to BPMN engine, status: " + response.getStatusCode());
        } catch (Exception e) {
            throw new BusinessException("BPMN deployment service error: " + e.getMessage());
        }
    }

    @Override
    @Retry(name = "bpmnEngine")
    public StartProcessResult startProcess(String processKey, Map<String, Object> variables) {
        Map<String, Object> reqBody = new HashMap<>();
        Map<String, Object> vars = new HashMap<>();
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            Map<String, Object> varDetail = new HashMap<>();
            varDetail.put("value", entry.getValue());
            vars.put(entry.getKey(), varDetail);
        }
        reqBody.put("variables", vars);

        String url = engineUrl + "/process-definition/key/" + processKey + "/start";
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, reqBody, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> responseBody = response.getBody();
                String id = (String) responseBody.get("id");
                String definitionId = (String) responseBody.get("definitionId");
                return StartProcessResult.builder().id(id).definitionId(definitionId).build();
            }
            throw new BusinessException("Failed to start process, status: " + response.getStatusCode());
        } catch (Exception e) {
            throw new BusinessException("BPMN start process error: " + e.getMessage());
        }
    }

    @Override
    @Retry(name = "bpmnEngine")
    @SuppressWarnings("unchecked")
    public List<BpmnTaskDto> getTasksByCandidateGroup(String group) {
        String url = engineUrl + "/task?candidateGroup=" + group;
        try {
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> tasks = response.getBody();
                return tasks.stream().map(this::mapToTaskDto).collect(Collectors.toList());
            }
            return Collections.emptyList();
        } catch (Exception e) {
            throw new BusinessException("BPMN get tasks by candidate group error: " + e.getMessage());
        }
    }

    @Override
    @Retry(name = "bpmnEngine")
    @SuppressWarnings("unchecked")
    public List<BpmnTaskDto> getTasksByAssignee(String assignee) {
        String url = engineUrl + "/task?assignee=" + assignee;
        try {
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> tasks = response.getBody();
                return tasks.stream().map(this::mapToTaskDto).collect(Collectors.toList());
            }
            return Collections.emptyList();
        } catch (Exception e) {
            throw new BusinessException("BPMN get tasks by assignee error: " + e.getMessage());
        }
    }

    @Override
    @Retry(name = "bpmnEngine")
    public void claimTask(String taskId, String username) {
        String url = engineUrl + "/task/" + taskId + "/claim";
        Map<String, String> reqBody = new HashMap<>();
        reqBody.put("userId", username);
        try {
            ResponseEntity<Void> response = restTemplate.postForEntity(url, reqBody, Void.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException("Failed to claim task " + taskId + ", status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new BusinessException("BPMN claim task error: " + e.getMessage());
        }
    }

    @Override
    @Retry(name = "bpmnEngine")
    public void completeTask(String taskId, Map<String, Object> variables) {
        String url = engineUrl + "/task/" + taskId + "/complete";
        Map<String, Object> reqBody = new HashMap<>();
        Map<String, Object> vars = new HashMap<>();
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            Map<String, Object> varDetail = new HashMap<>();
            varDetail.put("value", entry.getValue());
            vars.put(entry.getKey(), varDetail);
        }
        reqBody.put("variables", vars);
        try {
            ResponseEntity<Void> response = restTemplate.postForEntity(url, reqBody, Void.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException("Failed to complete task " + taskId + ", status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new BusinessException("BPMN complete task error: " + e.getMessage());
        }
    }

    @Override
    @Retry(name = "bpmnEngine")
    public ProcessInstanceDto getProcessInstance(String processInstanceId) {
        String url = engineUrl + "/process-instance/" + processInstanceId;
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> body = response.getBody();
                return ProcessInstanceDto.builder()
                        .id((String) body.get("id"))
                        .definitionId((String) body.get("definitionId"))
                        .ended(false)
                        .suspended((Boolean) body.get("suspended"))
                        .build();
            }
            return ProcessInstanceDto.builder().id(processInstanceId).ended(true).build();
        } catch (HttpClientErrorException.NotFound e) {
            return ProcessInstanceDto.builder().id(processInstanceId).ended(true).build();
        } catch (Exception e) {
            throw new BusinessException("BPMN get process instance error: " + e.getMessage());
        }
    }

    @Override
    @Retry(name = "bpmnEngine")
    @SuppressWarnings("unchecked")
    public List<HistoryDto> getHistory(String processInstanceId) {
        String url = engineUrl + "/history/activity-instance?processInstanceId=" + processInstanceId;
        try {
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> activities = response.getBody();
                return activities.stream()
                        .map(this::mapToHistoryDto)
                        .filter(h -> h.getActivityType().contains("Task") ||
                                h.getActivityType().contains("Gateway") ||
                                h.getActivityType().contains("Event"))
                        .collect(Collectors.toList());
            }
            return Collections.emptyList();
        } catch (Exception e) {
            throw new BusinessException("BPMN get process history error: " + e.getMessage());
        }
    }

    private BpmnTaskDto mapToTaskDto(Map<String, Object> map) {
        return BpmnTaskDto.builder()
                .id((String) map.get("id"))
                .name((String) map.get("name"))
                .taskDefinitionKey((String) map.get("taskDefinitionKey"))
                .assignee((String) map.get("assignee"))
                .processInstanceId((String) map.get("processInstanceId"))
                .created(parseDate(map.get("created")))
                .build();
    }

    private HistoryDto mapToHistoryDto(Map<String, Object> map) {
        return HistoryDto.builder()
                .id((String) map.get("id"))
                .activityId((String) map.get("activityId"))
                .activityName((String) map.get("activityName"))
                .activityType((String) map.get("activityType"))
                .startTime(parseDate(map.get("startTime")))
                .endTime(parseDate(map.get("endTime")))
                .assignee((String) map.get("assignee"))
                .build();
    }

    private Date parseDate(Object obj) {
        if (obj == null) return null;
        String dateStr = obj.toString();
        try {
            OffsetDateTime odt = OffsetDateTime.parse(dateStr);
            return Date.from(odt.toInstant());
        } catch (Exception e) {
            try {
                Instant instant = Instant.parse(dateStr);
                return Date.from(instant);
            } catch (Exception ex) {
                try {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
                    return sdf.parse(dateStr);
                } catch (Exception exc) {
                    return null;
                }
            }
        }
    }
}
