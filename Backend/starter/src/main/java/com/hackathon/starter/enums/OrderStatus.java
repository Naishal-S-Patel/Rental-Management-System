package com.hackathon.starter.enums;

/**
 * Drives the RentalOrder state machine (SYSTEM_DESIGN.md §4). Every order - online or
 * in-store - passes through PENDING_ADMIN_CONFIRMATION; there is no auto-confirm path.
 */
public enum OrderStatus {
    DRAFT,
    PENDING_ADMIN_CONFIRMATION,
    CONFIRMED,
    PAID,
    SCHEDULED_PICKUP,
    ACTIVE,
    RETURNED,
    SETTLED,
    CLOSED,
    CANCELLED
}
