package com.hackathon.starter.enums;

/**
 * Rental Management System has exactly two actors (PRD §1): ADMIN runs the org-wide backend
 * (catalog, pricing, quotations, confirmations, pickup/return, deposits, dashboard); CUSTOMER is
 * the portal self-service role (browse, cart, checkout, orders, addresses, invoices).
 *
 * Single enum column on User - one role per user, no join table (see CLAUDE.md).
 */
public enum Role {
    ADMIN,
    CUSTOMER
}
