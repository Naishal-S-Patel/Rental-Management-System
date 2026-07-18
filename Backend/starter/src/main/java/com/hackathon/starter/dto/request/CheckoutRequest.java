package com.hackathon.starter.dto.request;

import com.hackathon.starter.enums.FulfillmentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CheckoutRequest(
        @NotNull
        FulfillmentMethod fulfillmentMethod,

        @Schema(description = "Required if fulfillmentMethod is DELIVERY, ignored for STORE_PICKUP")
        UUID deliveryAddressId
) {
}
