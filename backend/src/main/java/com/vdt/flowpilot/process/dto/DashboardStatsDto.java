package com.vdt.flowpilot.process.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalRequests;
    private long runningProcesses;
    private long approvedRequests;
    private long rejectedRequests;
    private long completedRequests;
    private long failedRequests;
}
