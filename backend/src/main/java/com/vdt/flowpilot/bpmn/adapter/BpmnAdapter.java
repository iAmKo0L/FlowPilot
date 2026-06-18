package com.vdt.flowpilot.bpmn.adapter;

import com.vdt.flowpilot.bpmn.dto.*;
import java.util.List;
import java.util.Map;

public interface BpmnAdapter {
    DeploymentResult deployProcess(String processKey, String bpmnXml);
    StartProcessResult startProcess(String processKey, Map<String, Object> variables);
    List<BpmnTaskDto> getTasksByCandidateGroup(String group);
    List<BpmnTaskDto> getTasksByAssignee(String assignee);
    void claimTask(String taskId, String username);
    void completeTask(String taskId, Map<String, Object> variables);
    ProcessInstanceDto getProcessInstance(String processInstanceId);
    List<HistoryDto> getHistory(String processInstanceId);
}
