package com.hackathon.starter.service;

import com.hackathon.starter.entity.AttributeValue;
import com.hackathon.starter.entity.Product;
import com.hackathon.starter.entity.ProductVariant;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.AttributeValueRepository;
import com.hackathon.starter.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final AttributeValueRepository attributeValueRepository;
    private final ProductService productService;

    public ProductVariantService(ProductVariantRepository productVariantRepository,
                                  AttributeValueRepository attributeValueRepository,
                                  ProductService productService) {
        this.productVariantRepository = productVariantRepository;
        this.attributeValueRepository = attributeValueRepository;
        this.productService = productService;
    }

    public List<ProductVariant> listByProduct(UUID productId) {
        return productVariantRepository.findByProductId(productId);
    }

    public ProductVariant getById(UUID id) {
        return productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
    }

    @Transactional
    public ProductVariant create(UUID productId, String sku, int totalQuantity, List<Long> attributeValueIds) {
        Product product = productService.getById(productId);
        Set<AttributeValue> attributeValues = resolveAttributeValues(attributeValueIds);
        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .sku(sku)
                .totalQuantity(totalQuantity)
                .attributeValues(attributeValues)
                .build();
        return productVariantRepository.save(variant);
    }

    @Transactional
    public ProductVariant update(UUID id, String sku, int totalQuantity, List<Long> attributeValueIds) {
        ProductVariant variant = getById(id);
        variant.setSku(sku);
        variant.setTotalQuantity(totalQuantity);
        variant.setAttributeValues(resolveAttributeValues(attributeValueIds));
        return productVariantRepository.save(variant);
    }

    @Transactional
    public void deactivate(UUID id) {
        ProductVariant variant = getById(id);
        variant.setActive(false);
        productVariantRepository.save(variant);
    }

    private Set<AttributeValue> resolveAttributeValues(List<Long> attributeValueIds) {
        if (attributeValueIds == null || attributeValueIds.isEmpty()) {
            return new HashSet<>();
        }
        Set<AttributeValue> values = new HashSet<>(attributeValueRepository.findAllById(attributeValueIds));
        if (values.size() != new HashSet<>(attributeValueIds).size()) {
            throw new ResourceNotFoundException("One or more attribute values not found");
        }
        return values;
    }
}
