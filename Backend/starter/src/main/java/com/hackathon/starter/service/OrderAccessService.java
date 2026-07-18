package com.hackathon.starter.service;

import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.enums.Role;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.RentalOrderRepository;
import com.hackathon.starter.security.UserPrincipal;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Shared "own order, or any order if admin" guard. Returns 404 rather than 403 on a mismatch so a
 * customer can't distinguish "not yours" from "doesn't exist" (no order-id enumeration).
 */
@Service
public class OrderAccessService {

    private final RentalOrderRepository rentalOrderRepository;

    public OrderAccessService(RentalOrderRepository rentalOrderRepository) {
        this.rentalOrderRepository = rentalOrderRepository;
    }

    public RentalOrder requireOwnedOrAdmin(UserPrincipal principal, UUID orderId) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (principal.getRole() != Role.ADMIN && !order.getCustomer().getId().equals(principal.getId())) {
            throw new ResourceNotFoundException("Order not found");
        }
        return order;
    }
}
