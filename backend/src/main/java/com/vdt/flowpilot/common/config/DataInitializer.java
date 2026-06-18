package com.vdt.flowpilot.common.config;

import com.vdt.flowpilot.auth.entity.Role;
import com.vdt.flowpilot.auth.entity.User;
import com.vdt.flowpilot.auth.repository.RoleRepository;
import com.vdt.flowpilot.auth.repository.UserRepository;
import com.vdt.flowpilot.room.entity.Equipment;
import com.vdt.flowpilot.room.entity.MeetingRoom;
import com.vdt.flowpilot.room.repository.EquipmentRepository;
import com.vdt.flowpilot.room.repository.MeetingRoomRepository;
import com.vdt.flowpilot.workflow.entity.WorkflowDefinition;
import com.vdt.flowpilot.workflow.entity.WorkflowStep;
import com.vdt.flowpilot.workflow.repository.WorkflowDefinitionRepository;
import com.vdt.flowpilot.workflow.repository.WorkflowStepRepository;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;

@Component
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final MeetingRoomRepository roomRepository;
    private final EquipmentRepository equipmentRepository;
    private final WorkflowDefinitionRepository workflowRepository;
    private final WorkflowStepRepository stepRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           MeetingRoomRepository roomRepository,
                           EquipmentRepository equipmentRepository,
                           WorkflowDefinitionRepository workflowRepository,
                           WorkflowStepRepository stepRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.equipmentRepository = equipmentRepository;
        this.workflowRepository = workflowRepository;
        this.stepRepository = stepRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ContextRefreshedEvent.class)
    @Transactional
    public void initializeData() {
        seedRolesAndUsers();
        seedRoomsAndEquipment();
        seedWorkflow();
    }

    private void seedRolesAndUsers() {
        if (roleRepository.count() == 0) {
            roleRepository.save(Role.builder().code("ADMIN").name("Quản trị viên").build());
            roleRepository.save(Role.builder().code("REQUESTER").name("Người yêu cầu").build());
            roleRepository.save(Role.builder().code("APPROVER").name("Người phê duyệt").build());
        }

        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByCode("ADMIN").orElseThrow();
            Role requesterRole = roleRepository.findByCode("REQUESTER").orElseThrow();
            Role approverRole = roleRepository.findByCode("APPROVER").orElseThrow();

            userRepository.save(User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Quản trị viên hệ thống")
                    .email("admin@flowpilot.com")
                    .roles(new HashSet<>(Collections.singletonList(adminRole)))
                    .enabled(true)
                    .build());

            userRepository.save(User.builder()
                    .username("requester01")
                    .password(passwordEncoder.encode("requester123"))
                    .fullName("Nguyễn Văn Requester")
                    .email("requester01@flowpilot.com")
                    .roles(new HashSet<>(Collections.singletonList(requesterRole)))
                    .enabled(true)
                    .build());

            userRepository.save(User.builder()
                    .username("approver01")
                    .password(passwordEncoder.encode("approver123"))
                    .fullName("Trần Thị Approver")
                    .email("approver01@flowpilot.com")
                    .roles(new HashSet<>(Collections.singletonList(approverRole)))
                    .enabled(true)
                    .build());

            userRepository.save(User.builder()
                    .username("user01")
                    .password(passwordEncoder.encode("user123"))
                    .fullName("Phạm Văn User Nội Bộ")
                    .email("user01@flowpilot.com")
                    .roles(new HashSet<>(Collections.singletonList(requesterRole)))
                    .enabled(true)
                    .build());
        }
    }

    private void seedRoomsAndEquipment() {
        if (equipmentRepository.count() == 0) {
            equipmentRepository.save(Equipment.builder().equipmentCode("PROJECTOR").equipmentName("Máy chiếu").status("ACTIVE").description("Máy chiếu độ phân giải cao").build());
            equipmentRepository.save(Equipment.builder().equipmentCode("MIC").equipmentName("Micro không dây").status("ACTIVE").description("Micro cảm tay tiện lợi").build());
            equipmentRepository.save(Equipment.builder().equipmentCode("WHITEBOARD").equipmentName("Bảng trắng").status("ACTIVE").description("Bảng viết bút dạ").build());
            equipmentRepository.save(Equipment.builder().equipmentCode("TV_SCREEN").equipmentName("Màn hình TV").status("ACTIVE").description("Tivi 65 inch hiển thị sắc nét").build());
            equipmentRepository.save(Equipment.builder().equipmentCode("VIDEO_CONFERENCE").equipmentName("Thiết bị họp trực tuyến").status("ACTIVE").description("Camera và loa họp trực tuyến chuyên nghiệp").build());
        }

        if (roomRepository.count() == 0) {
            Equipment projector = equipmentRepository.findByEquipmentCode("PROJECTOR").orElseThrow();
            Equipment mic = equipmentRepository.findByEquipmentCode("MIC").orElseThrow();
            Equipment whiteboard = equipmentRepository.findByEquipmentCode("WHITEBOARD").orElseThrow();
            Equipment tv = equipmentRepository.findByEquipmentCode("TV_SCREEN").orElseThrow();
            Equipment videoConf = equipmentRepository.findByEquipmentCode("VIDEO_CONFERENCE").orElseThrow();

            MeetingRoom roomA = MeetingRoom.builder()
                    .roomCode("ROOM_A101")
                    .roomName("Phòng họp A101")
                    .location("Tầng 1 - Tòa nhà A")
                    .capacity(10)
                    .status("ACTIVE")
                    .description("Phòng họp nhỏ thích hợp thảo luận nhóm")
                    .equipments(new HashSet<>())
                    .build();
            roomA.getEquipments().add(projector);
            roomA.getEquipments().add(whiteboard);
            roomRepository.save(roomA);

            MeetingRoom roomB = MeetingRoom.builder()
                    .roomCode("ROOM_B201")
                    .roomName("Phòng họp B201")
                    .location("Tầng 2 - Tòa nhà B")
                    .capacity(20)
                    .status("ACTIVE")
                    .description("Phòng họp lớn trang bị thiết bị họp trực tuyến hiện đại")
                    .equipments(new HashSet<>())
                    .build();
            roomB.getEquipments().add(mic);
            roomB.getEquipments().add(tv);
            roomB.getEquipments().add(videoConf);
            roomRepository.save(roomB);

            MeetingRoom roomOnline = MeetingRoom.builder()
                    .roomCode("ROOM_ONLINE")
                    .roomName("Phòng họp trực tuyến")
                    .location("Hệ thống online")
                    .capacity(100)
                    .status("ACTIVE")
                    .description("Phòng họp ảo dành cho các cuộc họp trực tuyến từ xa")
                    .equipments(new HashSet<>())
                    .build();
            roomRepository.save(roomOnline);
        }
    }

    private void seedWorkflow() {
        if (workflowRepository.count() == 0) {
            WorkflowDefinition meetingWorkflow = WorkflowDefinition.builder()
                    .code("MEETING_SCHEDULING_WORKFLOW")
                    .name("Quy trình tạo lịch họp")
                    .description("Quy trình tạo lịch họp gồm kiểm tra phòng, phê duyệt, thông báo và phản hồi người tham gia")
                    .bpmnProcessKey("meeting_scheduling_workflow_v1")
                    .status("DRAFT")
                    .version(1)
                    .createdBy("admin")
                    .steps(new ArrayList<>())
                    .formFields(new ArrayList<>())
                    .build();

            meetingWorkflow = workflowRepository.save(meetingWorkflow);

            WorkflowStep step1 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("start")
                    .stepName("Tiếp nhận yêu cầu")
                    .stepType("START")
                    .orderIndex(1)
                    .build();

            WorkflowStep step2 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("validate_request")
                    .stepName("Kiểm tra điều kiện lịch họp")
                    .stepType("SERVICE_TASK")
                    .orderIndex(2)
                    .build();

            WorkflowStep step3 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("hold_room")
                    .stepName("Tạm giữ phòng họp")
                    .stepType("SERVICE_TASK")
                    .orderIndex(3)
                    .build();

            WorkflowStep step4 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("approval")
                    .stepName("Phê duyệt lịch họp")
                    .stepType("APPROVE")
                    .assigneeRole("APPROVER")
                    .orderIndex(4)
                    .build();

            WorkflowStep step5 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("approval_decision")
                    .stepName("Phân tích kết quả phê duyệt")
                    .stepType("CONDITION")
                    .configJson("{\"variable\":\"approved\",\"trueTarget\":\"confirm_meeting\",\"falseTarget\":\"cancel_hold\"}")
                    .orderIndex(5)
                    .build();

            WorkflowStep step6 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("cancel_hold")
                    .stepName("Hủy giữ phòng")
                    .stepType("SERVICE_TASK")
                    .orderIndex(6)
                    .build();

            WorkflowStep step7 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("notify_rejected")
                    .stepName("Thông báo từ chối")
                    .stepType("SERVICE_TASK")
                    .orderIndex(7)
                    .build();

            WorkflowStep step8 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("rejected")
                    .stepName("Kết thúc bị từ chối")
                    .stepType("END")
                    .orderIndex(8)
                    .build();

            WorkflowStep step9 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("confirm_meeting")
                    .stepName("Xác nhận lịch họp")
                    .stepType("SERVICE_TASK")
                    .orderIndex(9)
                    .build();

            WorkflowStep step10 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("notify_attendees")
                    .stepName("Thông báo người tham gia")
                    .stepType("SERVICE_TASK")
                    .orderIndex(10)
                    .build();

            WorkflowStep step11 = WorkflowStep.builder()
                    .workflow(meetingWorkflow)
                    .stepKey("completed")
                    .stepName("Hoàn thành lịch họp")
                    .stepType("END")
                    .orderIndex(11)
                    .build();

            stepRepository.save(step1);
            stepRepository.save(step2);
            stepRepository.save(step3);
            stepRepository.save(step4);
            stepRepository.save(step5);
            stepRepository.save(step6);
            stepRepository.save(step7);
            stepRepository.save(step8);
            stepRepository.save(step9);
            stepRepository.save(step10);
            stepRepository.save(step11);

            meetingWorkflow.getSteps().add(step1);
            meetingWorkflow.getSteps().add(step2);
            meetingWorkflow.getSteps().add(step3);
            meetingWorkflow.getSteps().add(step4);
            meetingWorkflow.getSteps().add(step5);
            meetingWorkflow.getSteps().add(step6);
            meetingWorkflow.getSteps().add(step7);
            meetingWorkflow.getSteps().add(step8);
            meetingWorkflow.getSteps().add(step9);
            meetingWorkflow.getSteps().add(step10);
            meetingWorkflow.getSteps().add(step11);

            workflowRepository.save(meetingWorkflow);
        }
    }
}

