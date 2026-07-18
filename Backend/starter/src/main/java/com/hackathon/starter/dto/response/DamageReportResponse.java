package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.RepairStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record DamageReportResponse(
        Long id,
        String description,
        BigDecimal estimatedCost,
        RepairStatus repairStatus,
        List<UUID> photoFileIds
) {
}
