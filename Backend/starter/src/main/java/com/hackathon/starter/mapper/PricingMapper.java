package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.PricelistItemResponse;
import com.hackathon.starter.dto.response.PricelistResponse;
import com.hackathon.starter.dto.response.RentalPeriodResponse;
import com.hackathon.starter.entity.Pricelist;
import com.hackathon.starter.entity.PricelistItem;
import com.hackathon.starter.entity.RentalPeriod;
import org.springframework.stereotype.Component;

@Component
public class PricingMapper {

    public PricelistResponse toResponse(Pricelist pricelist) {
        return new PricelistResponse(pricelist.getId(), pricelist.getName(), pricelist.isDefault(),
                pricelist.getValidFrom(), pricelist.getValidTo(), pricelist.isActive(), pricelist.getCreatedAt());
    }

    public PricelistItemResponse toResponse(PricelistItem item) {
        return new PricelistItemResponse(item.getId(), item.getProductVariant().getId(), item.getDurationUnit(), item.getUnitPrice());
    }

    public RentalPeriodResponse toResponse(RentalPeriod period) {
        return new RentalPeriodResponse(period.getId(), period.getName(), period.getDurationValue(),
                period.getDurationUnit(), period.isActive());
    }
}
