package com.hackathon.starter.service;

import com.hackathon.starter.entity.Pricelist;
import com.hackathon.starter.entity.PricelistItem;
import com.hackathon.starter.entity.ProductVariant;
import com.hackathon.starter.enums.DurationUnit;
import com.hackathon.starter.exception.BadRequestException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.PricelistItemRepository;
import com.hackathon.starter.repository.PricelistRepository;
import com.hackathon.starter.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class PricelistService {

    private final PricelistRepository pricelistRepository;
    private final PricelistItemRepository pricelistItemRepository;
    private final ProductVariantRepository productVariantRepository;

    public PricelistService(PricelistRepository pricelistRepository, PricelistItemRepository pricelistItemRepository,
                             ProductVariantRepository productVariantRepository) {
        this.pricelistRepository = pricelistRepository;
        this.pricelistItemRepository = pricelistItemRepository;
        this.productVariantRepository = productVariantRepository;
    }

    public List<Pricelist> list() {
        return pricelistRepository.findAll();
    }

    public Pricelist getById(Long id) {
        return pricelistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pricelist not found"));
    }

    @Transactional
    public Pricelist create(String name, LocalDate validFrom, LocalDate validTo, boolean isDefault) {
        if (isDefault) {
            unsetCurrentDefault();
        }
        return pricelistRepository.save(Pricelist.builder()
                .name(name).validFrom(validFrom).validTo(validTo).isDefault(isDefault).build());
    }

    @Transactional
    public Pricelist update(Long id, String name, LocalDate validFrom, LocalDate validTo, boolean isDefault) {
        Pricelist pricelist = getById(id);
        if (isDefault && !pricelist.isDefault()) {
            unsetCurrentDefault();
        }
        pricelist.setName(name);
        pricelist.setValidFrom(validFrom);
        pricelist.setValidTo(validTo);
        pricelist.setDefault(isDefault);
        return pricelistRepository.save(pricelist);
    }

    /** Cannot delete the default pricelist (DB_SCHEMA.md §2.3) - every product/variant needs at least one price source. */
    @Transactional
    public void delete(Long id) {
        Pricelist pricelist = getById(id);
        if (pricelist.isDefault()) {
            throw new BadRequestException("Cannot delete the default pricelist");
        }
        pricelistRepository.delete(pricelist);
    }

    @Transactional
    public PricelistItem addItem(Long pricelistId, UUID productVariantId, DurationUnit durationUnit, BigDecimal unitPrice) {
        Pricelist pricelist = getById(pricelistId);
        ProductVariant variant = productVariantRepository.findById(productVariantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
        pricelistItemRepository.findByPricelistIdAndProductVariantIdAndDurationUnit(pricelistId, productVariantId, durationUnit)
                .ifPresent(existing -> {
                    throw new BadRequestException("A price rule for this variant/duration already exists on this pricelist");
                });
        return pricelistItemRepository.save(PricelistItem.builder()
                .pricelist(pricelist).productVariant(variant).durationUnit(durationUnit).unitPrice(unitPrice).build());
    }

    public List<PricelistItem> listItems(Long pricelistId) {
        return pricelistItemRepository.findByPricelistId(pricelistId);
    }

    @Transactional
    public void removeItem(Long pricelistId, Long itemId) {
        PricelistItem item = pricelistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Price rule not found"));
        if (!item.getPricelist().getId().equals(pricelistId)) {
            throw new ResourceNotFoundException("Price rule not found");
        }
        pricelistItemRepository.delete(item);
    }

    private void unsetCurrentDefault() {
        pricelistRepository.findByIsDefaultTrue().ifPresent(current -> {
            current.setDefault(false);
            pricelistRepository.save(current);
        });
    }
}
