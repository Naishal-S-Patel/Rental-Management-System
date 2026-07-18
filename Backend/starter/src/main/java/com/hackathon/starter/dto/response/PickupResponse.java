package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.PickupStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record PickupResponse(
        Long id,
        UUID orderId,
        LocalDate scheduledDate,
        PickupStatus status,
        String checklistNotes,
        LocalDateTime confirmedAt
) {
}
