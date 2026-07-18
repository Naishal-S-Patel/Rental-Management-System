package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.OrderLineResponse;
import com.hackathon.starter.dto.response.OrderResponse;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.RentalOrderLine;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {

    public OrderLineResponse toResponse(RentalOrderLine line) {
        return new OrderLineResponse(line.getId(), line.getProductVariant().getId(),
                line.getProductVariant().getProduct().getName(), line.getQuantity(),
                line.getStartDate(), line.getEndDate(), line.getUnitPrice(), line.getLineTotal());
    }

    public OrderResponse toResponse(RentalOrder order) {
        var lines = order.getLines().stream().map(this::toResponse).toList();
        return new OrderResponse(
                order.getId(), order.getCustomer().getId(),
                (order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName()).trim(),
                order.getStatus(), order.getFulfillmentMethod(),
                order.getDeliveryAddress() != null ? order.getDeliveryAddress().getId() : null,
                lines, order.getSubtotalAmount(), order.getDepositAmount(), order.getTotalAmount(),
                order.getConfirmedBy() != null ? order.getConfirmedBy().getId() : null,
                order.getConfirmedAt(), order.getCreatedAt());
    }
}
