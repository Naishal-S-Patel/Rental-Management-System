package com.hackathon.starter.service;

import com.hackathon.starter.entity.Product;
import com.hackathon.starter.entity.ProductImage;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.ProductImageRepository;
import com.hackathon.starter.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;

    public ProductService(ProductRepository productRepository, ProductImageRepository productImageRepository) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
    }

    public Page<Product> search(String category, String search, Pageable pageable) {
        return productRepository.search(category, search, pageable);
    }

    public Product getById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    @Transactional
    public Product create(String name, String description, String category, BigDecimal basePrice, BigDecimal securityDepositAmount) {
        Product product = Product.builder()
                .name(name)
                .description(description)
                .category(category)
                .basePrice(basePrice)
                .securityDepositAmount(securityDepositAmount)
                .build();
        return productRepository.save(product);
    }

    @Transactional
    public Product update(UUID id, String name, String description, String category, BigDecimal basePrice, BigDecimal securityDepositAmount) {
        Product product = getById(id);
        product.setName(name);
        product.setDescription(description);
        product.setCategory(category);
        product.setBasePrice(basePrice);
        product.setSecurityDepositAmount(securityDepositAmount);
        return productRepository.save(product);
    }

    /** Soft-delete only - never hard-delete a product referenced by past orders (DB_SCHEMA.md §2.2). */
    @Transactional
    public void deactivate(UUID id) {
        Product product = getById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public ProductImage addImage(UUID productId, UUID fileId, int sortOrder) {
        Product product = getById(productId);
        return productImageRepository.save(ProductImage.builder()
                .product(product)
                .fileId(fileId)
                .sortOrder(sortOrder)
                .build());
    }

    public List<ProductImage> listImages(UUID productId) {
        return productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
    }
}
