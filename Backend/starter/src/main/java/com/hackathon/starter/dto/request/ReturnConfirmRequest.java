package com.hackathon.starter.dto.request;

public record ReturnConfirmRequest(
        String conditionNotes,
        boolean damageReported,
        boolean missingAccessories
) {
}
