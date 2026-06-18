package com.vdt.flowpilot.bpmn.generator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vdt.flowpilot.common.exception.BusinessException;
import com.vdt.flowpilot.workflow.entity.WorkflowDefinition;
import com.vdt.flowpilot.workflow.entity.WorkflowStep;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class BpmnXmlGenerator {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    public BpmnXmlGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String generateBpmnXml(WorkflowDefinition workflow) {
        List<WorkflowStep> steps = workflow.getSteps().stream()
                .sorted(Comparator.comparing(WorkflowStep::getOrderIndex).thenComparing(WorkflowStep::getId))
                .toList();

        validateSteps(steps);

        String processKey = workflow.getBpmnProcessKey() != null && !workflow.getBpmnProcessKey().isBlank()
                ? workflow.getBpmnProcessKey()
                : workflow.getCode();
        String processName = workflow.getName();

        Map<String, WorkflowStep> stepByKey = new HashMap<>();
        for (WorkflowStep step : steps) {
            stepByKey.put(step.getStepKey(), step);
        }

        List<String> flowXml = new ArrayList<>();
        List<String> nodeXml = new ArrayList<>();
        List<SequenceFlowEdge> flowEdges = new ArrayList<>();
        Set<String> explicitConditionSources = new HashSet<>();

        for (int i = 0; i < steps.size(); i++) {
            WorkflowStep step = steps.get(i);
            String id = stepId(step);
            String name = xml(step.getStepName());
            String type = normalizeType(step.getStepType());

            if ("START".equals(type)) {
                nodeXml.add("    <bpmn:startEvent id=\"" + id + "\" name=\"" + name + "\" />");
            } else if ("END".equals(type)) {
                nodeXml.add("    <bpmn:endEvent id=\"" + id + "\" name=\"" + name + "\" />");
            } else if ("CONDITION".equals(type)) {
                nodeXml.add("    <bpmn:exclusiveGateway id=\"" + id + "\" name=\"" + name + "\" />");
                addConditionFlows(step, stepByKey, flowXml, flowEdges);
                explicitConditionSources.add(step.getStepKey());
            } else if ("USER_TASK".equals(type) || "APPROVE".equals(type)) {
                String role = step.getAssigneeRole() != null && !step.getAssigneeRole().isBlank()
                        ? " camunda:candidateGroups=\"" + xml(step.getAssigneeRole().trim().toUpperCase()) + "\""
                        : "";
                nodeXml.add("    <bpmn:userTask id=\"" + id + "\" name=\"" + name + "\"" + role + " />");
            } else {
                nodeXml.add("    <bpmn:serviceTask id=\"" + id + "\" name=\"" + name + "\" camunda:expression=\"${true}\" />");
            }

            if (i + 1 < steps.size() && !"END".equals(type) && !explicitConditionSources.contains(step.getStepKey())) {
                WorkflowStep next = steps.get(i + 1);
                flowXml.add(sequenceFlow(step.getStepKey() + "_to_" + next.getStepKey(), id, stepId(next), null, flowEdges));
            }
        }

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"\n")
                .append("                  xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\"\n")
                .append("                  xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\"\n")
                .append("                  xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\"\n")
                .append("                  xmlns:camunda=\"http://camunda.org/schema/1.0/bpmn\"\n")
                .append("                  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n")
                .append("                  id=\"Definitions_").append(xml(processKey)).append("\"\n")
                .append("                  targetNamespace=\"http://flowpilot.vdt/workflows\">\n")
                .append("  <bpmn:process id=\"").append(xml(processKey)).append("\" name=\"")
                .append(xml(processName)).append("\" isExecutable=\"true\" camunda:historyTimeToLive=\"180\">\n");

        nodeXml.forEach(line -> xml.append(line).append("\n"));
        flowXml.forEach(line -> xml.append(line).append("\n"));

        xml.append("  </bpmn:process>\n")
                .append("  <bpmndi:BPMNDiagram id=\"BPMNDiagram_").append(xml(processKey)).append("\">\n")
                .append("    <bpmndi:BPMNPlane id=\"BPMNPlane_").append(xml(processKey)).append("\" bpmnElement=\"")
                .append(xml(processKey)).append("\">\n");

        Map<String, Integer> laneByStepKey = computeBranchLanes(steps);
        Map<String, ShapeBounds> boundsByElementId = new HashMap<>();
        for (int i = 0; i < steps.size(); i++) {
            WorkflowStep step = steps.get(i);
            ShapeBounds bounds = boundsFor(step, i, laneByStepKey.getOrDefault(step.getStepKey(), 0));
            boundsByElementId.put(stepId(step), bounds);
            xml.append("      <bpmndi:BPMNShape id=\"").append(stepId(step)).append("_di\" bpmnElement=\"")
                    .append(stepId(step)).append("\">\n")
                    .append("        <dc:Bounds x=\"").append(bounds.x).append("\" y=\"").append(bounds.y).append("\" width=\"")
                    .append(bounds.width).append("\" height=\"").append(bounds.height).append("\" />\n")
                    .append("      </bpmndi:BPMNShape>\n");
        }

        for (SequenceFlowEdge edge : flowEdges) {
            ShapeBounds source = boundsByElementId.get(edge.sourceRef());
            ShapeBounds target = boundsByElementId.get(edge.targetRef());
            if (source == null || target == null) {
                continue;
            }

            int sourceX = source.x + source.width;
            int sourceY = source.centerY();
            int targetX = target.x;
            int targetY = target.centerY();
            int middleX = sourceX + Math.max(50, (targetX - sourceX) / 2);

            xml.append("      <bpmndi:BPMNEdge id=\"").append(xml(edge.id())).append("_di\" bpmnElement=\"")
                    .append(xml(edge.id())).append("\">\n")
                    .append("        <di:waypoint x=\"").append(sourceX).append("\" y=\"").append(sourceY).append("\" />\n");

            if (sourceY != targetY) {
                xml.append("        <di:waypoint x=\"").append(middleX).append("\" y=\"").append(sourceY).append("\" />\n")
                        .append("        <di:waypoint x=\"").append(middleX).append("\" y=\"").append(targetY).append("\" />\n");
            }

            xml.append("        <di:waypoint x=\"").append(targetX).append("\" y=\"").append(targetY).append("\" />\n")
                    .append("      </bpmndi:BPMNEdge>\n");
        }

        xml.append("    </bpmndi:BPMNPlane>\n")
                .append("  </bpmndi:BPMNDiagram>\n")
                .append("</bpmn:definitions>");

        return xml.toString();
    }

    private void validateSteps(List<WorkflowStep> steps) {
        if (steps.isEmpty()) {
            throw new BusinessException("Cannot generate BPMN XML for a workflow without steps");
        }

        long startCount = steps.stream().filter(s -> "START".equals(normalizeType(s.getStepType()))).count();
        long endCount = steps.stream().filter(s -> "END".equals(normalizeType(s.getStepType()))).count();
        if (startCount != 1) {
            throw new BusinessException("Workflow must contain exactly one START step");
        }
        if (endCount < 1) {
            throw new BusinessException("Workflow must contain at least one END step");
        }
    }

    private void addConditionFlows(WorkflowStep step,
                                   Map<String, WorkflowStep> stepByKey,
                                   List<String> flowXml,
                                   List<SequenceFlowEdge> flowEdges) {
        Map<String, Object> config = readConfig(step);
        String variable = String.valueOf(config.getOrDefault("variable", "approved"));
        String trueTarget = (String) config.get("trueTarget");
        String falseTarget = (String) config.get("falseTarget");

        if (trueTarget == null || falseTarget == null) {
            return;
        }
        if (!stepByKey.containsKey(trueTarget) || !stepByKey.containsKey(falseTarget)) {
            throw new BusinessException("Condition step " + step.getStepKey() + " references unknown target step");
        }

        String safeVariable = variable.replace("\\", "\\\\").replace("\"", "\\\"");
        flowXml.add(sequenceFlow(step.getStepKey() + "_true_to_" + trueTarget, stepId(step), stepId(stepByKey.get(trueTarget)),
                "${execution.getVariable(\"" + safeVariable + "\") == true}", flowEdges));
        flowXml.add(sequenceFlow(step.getStepKey() + "_false_to_" + falseTarget, stepId(step), stepId(stepByKey.get(falseTarget)),
                "${execution.getVariable(\"" + safeVariable + "\") != true}", flowEdges));
    }

    private Map<String, Object> readConfig(WorkflowStep step) {
        if (step.getConfigJson() == null || step.getConfigJson().isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(step.getConfigJson(), MAP_TYPE);
        } catch (Exception e) {
            throw new BusinessException("Invalid configJson for step " + step.getStepKey() + ": " + e.getMessage());
        }
    }

    private String sequenceFlow(String id, String sourceRef, String targetRef, String condition, List<SequenceFlowEdge> flowEdges) {
        String flowId = "flow_" + sanitizeId(id);
        flowEdges.add(new SequenceFlowEdge(flowId, sourceRef, targetRef));

        StringBuilder flow = new StringBuilder("    <bpmn:sequenceFlow id=\"")
                .append(xml(flowId)).append("\" sourceRef=\"")
                .append(sourceRef).append("\" targetRef=\"").append(targetRef).append("\"");
        if (condition == null) {
            return flow.append(" />").toString();
        }
        return flow.append(">\n")
                .append("      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">")
                .append(xml(condition))
                .append("</bpmn:conditionExpression>\n")
                .append("    </bpmn:sequenceFlow>")
                .toString();
    }

    private boolean isEvent(WorkflowStep step) {
        String type = normalizeType(step.getStepType());
        return "START".equals(type) || "END".equals(type);
    }

    private Map<String, Integer> computeBranchLanes(List<WorkflowStep> steps) {
        Map<String, Integer> lanes = new HashMap<>();
        Map<String, Integer> indexByKey = new HashMap<>();
        for (int i = 0; i < steps.size(); i++) {
            lanes.put(steps.get(i).getStepKey(), 0);
            indexByKey.put(steps.get(i).getStepKey(), i);
        }

        for (WorkflowStep step : steps) {
            if (!"CONDITION".equals(normalizeType(step.getStepType()))) {
                continue;
            }

            Map<String, Object> config = readConfig(step);
            String trueTarget = config.get("trueTarget") instanceof String value ? value : null;
            String falseTarget = config.get("falseTarget") instanceof String value ? value : null;
            assignBranchLane(steps, indexByKey, lanes, falseTarget, -1);
            assignBranchLane(steps, indexByKey, lanes, trueTarget, 1);
        }

        return lanes;
    }

    private void assignBranchLane(List<WorkflowStep> steps,
                                  Map<String, Integer> indexByKey,
                                  Map<String, Integer> lanes,
                                  String targetKey,
                                  int lane) {
        Integer startIndex = targetKey != null ? indexByKey.get(targetKey) : null;
        if (startIndex == null) {
            return;
        }

        for (int i = startIndex; i < steps.size(); i++) {
            WorkflowStep step = steps.get(i);
            lanes.put(step.getStepKey(), lane);
            if ("END".equals(normalizeType(step.getStepType()))) {
                break;
            }
        }
    }

    private ShapeBounds boundsFor(WorkflowStep step, int index, int lane) {
        int x = 160 + index * 170;
        int centerY = 160 + lane * 120;
        String type = normalizeType(step.getStepType());
        if ("START".equals(type) || "END".equals(type)) {
            return new ShapeBounds(x, centerY - 18, 36, 36);
        }
        if ("CONDITION".equals(type)) {
            return new ShapeBounds(x, centerY - 28, 56, 56);
        }
        return new ShapeBounds(x, centerY - 40, 120, 80);
    }

    private String stepId(WorkflowStep step) {
        return "step_" + sanitizeId(step.getStepKey());
    }

    private String normalizeType(String type) {
        return type == null ? "" : type.trim().toUpperCase();
    }

    private String sanitizeId(String value) {
        String sanitized = value == null ? "unnamed" : value.replaceAll("[^A-Za-z0-9_]", "_");
        if (sanitized.isBlank()) {
            return "unnamed";
        }
        if (Character.isDigit(sanitized.charAt(0))) {
            return "_" + sanitized;
        }
        return sanitized;
    }

    private String xml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private record SequenceFlowEdge(String id, String sourceRef, String targetRef) {}

    private record ShapeBounds(int x, int y, int width, int height) {
        int centerY() {
            return y + height / 2;
        }
    }
}
