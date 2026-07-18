package com.hackathon.starter.dto.response;

import java.math.BigDecimal;

/** One aggregate payload backing the admin dashboard (PDF §1). */
public record DashboardSummaryResponse(
        long activeRentals,
        long rentalsDueToday,
        long upcomingPickups,
        long upcomingReturns,
        long overdueRentals,
        BigDecimal revenue,
        BigDecimal depositsHeld,
        BigDecimal lateFeeCollection
) {
}
