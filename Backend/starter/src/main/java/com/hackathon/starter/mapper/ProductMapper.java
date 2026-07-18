package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.ProductResponse;
import com.hackathon.starter.dto.response.ProductVariantResponse;
import com.hackathon.starter.entity.AttributeValue;
import com.hackathon.starter.entity.Product;
import com.hackathon.starter.entity.ProductVariant;
import com.hackathon.starter.repository.ProductImageRepository;
import com.hackathon.starter.repository.ProductVariantRepository;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class ProductMapper {

    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;

    public ProductMapper(ProductImageRepository productImageRepository, ProductVariantRepository productVariantRepository) {
        this.productImageRepository = productImageRepository;
        this.productVariantRepository = productVariantRepository;
    }

    public ProductVariantResponse toResponse(ProductVariant variant) {
        Map<String, String> attributes = new LinkedHashMap<>();
        for (AttributeValue value : variant.getAttributeValues()) {
            attributes.put(value.getAttributeType().getName(), value.getValue());
        }
        return new ProductVariantResponse(variant.getId(), variant.getSku(), variant.getTotalQuantity(), variant.isActive(), attributes);
    }

    public ProductResponse toResponse(Product product) {
        List<UUID> imageFileIds = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId()).stream()
                .map(image -> image.getFileId())
                .toList();
        List<ProductVariantResponse> variants = productVariantRepository.findByProductId(product.getId()).stream()
                .map(this::toResponse)
                .toList();
        return new ProductResponse(
                product.getId(), product.getName(), product.getDescription(), product.getCategory(),
                product.getBasePrice(), product.getSecurityDepositAmount(), product.isActive(),
                imageFileIds, variants, product.getCreatedAt());
    }
}
