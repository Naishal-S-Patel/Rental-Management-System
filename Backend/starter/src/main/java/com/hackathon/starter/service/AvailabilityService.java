package com.hackathon.starter.service;

import com.hackathon.starter.entity.ProductVariant;
import com.hackathon.starter.enums.OrderStatus;
import com.hackathon.starter.exception.OutOfStockException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.ProductVariantRepository;
import com.hackathon.starter.repository.RentalOrderLineRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Quantity-based availability (PRD_README.md §3/Q4): a variant's stock minus whatever's reserved
 * by overlapping order lines whose order is in a stock-holding status (SYSTEM_DESIGN.md §5.1).
 * Called both advisory (cart add) and authoritative (order confirm, inside the confirming
 * transaction - callers pass excludeOrderId=null there since the order doesn't exist yet, or the
 * order's own id when re-checking during e.g. a line-quantity edit so the order doesn't count
 * against itself).
 */
@Service
public class AvailabilityService {

    private static final List<OrderStatus> STOCK_HOLDING_STATUSES = List.of(
            OrderStatus.CONFIRMED, OrderStatus.PAID, OrderStatus.SCHEDULED_PICKUP, OrderStatus.ACTIVE);

    private final ProductVariantRepository productVariantRepository;
    private final RentalOrderLineRepository rentalOrderLineRepository;

    public AvailabilityService(ProductVariantRepository productVariantRepository,
                                RentalOrderLineRepository rentalOrderLineRepository) {
        this.productVariantRepository = productVariantRepository;
        this.rentalOrderLineRepository = rentalOrderLineRepository;
    }

    public int availableQuantity(UUID variantId, LocalDate startDate, LocalDate endDate, UUID excludeOrderId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
        int reserved = rentalOrderLineRepository.sumReservedQuantity(
                variantId, STOCK_HOLDING_STATUSES, startDate, endDate, excludeOrderId);
        return variant.getTotalQuantity() - reserved;
    }

    public void ensureAvailable(UUID variantId, LocalDate startDate, LocalDate endDate, int requestedQty, UUID excludeOrderId) {
        int available = availableQuantity(variantId, startDate, endDate, excludeOrderId);
        if (available < requestedQty) {
            throw new OutOfStockException(
                    "Only %d unit(s) available for the selected dates (requested %d)".formatted(available, requestedQty));
        }
    }
}
