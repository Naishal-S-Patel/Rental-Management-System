package com.hackathon.starter.dto.response;

import java.time.LocalDate;
import java.util.UUID;

public record OverdueOrderResponse(
        UUID orderId,
        String customerName,
        LocalDate dueDate,
        long daysOverdue
) {
}
