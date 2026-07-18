package com.hackathon.starter.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PickupScheduleRequest(
        @NotNull @FutureOrPresent
        LocalDate scheduledDate
) {
}
