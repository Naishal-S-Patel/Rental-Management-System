package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.ReturnStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReturnResponse(
        Long id,
        UUID orderId,
        LocalDate scheduledDate,
        LocalDateTime actualReturnDate,
        ReturnStatus status,
        String conditionNotes,
        boolean damageReported,
        boolean missingAccessories
) {
}
