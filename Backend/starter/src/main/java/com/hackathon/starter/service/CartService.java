package com.hackathon.starter.service;

import com.hackathon.starter.entity.Cart;
import com.hackathon.starter.entity.CartItem;
import com.hackathon.starter.entity.ProductVariant;
import com.hackathon.starter.entity.RentalPeriod;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.exception.BadRequestException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.CartItemRepository;
import com.hackathon.starter.repository.CartRepository;
import com.hackathon.starter.repository.ProductVariantRepository;
import com.hackathon.starter.repository.RentalPeriodRepository;
import com.hackathon.starter.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * CRUD only - checkout (cart -> RentalOrder) lives in OrderService, since converting a cart
 * requires the same order-creation logic an admin-side quotation confirmation also needs.
 * Availability here is advisory only (SYSTEM_DESIGN.md §5.1) - the authoritative re-check
 * happens inside OrderService.confirm(...).
 */
@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final RentalPeriodRepository rentalPeriodRepository;
    private final UserRepository userRepository;
    private final AvailabilityService availabilityService;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                        ProductVariantRepository productVariantRepository, RentalPeriodRepository rentalPeriodRepository,
                        UserRepository userRepository, AvailabilityService availabilityService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productVariantRepository = productVariantRepository;
        this.rentalPeriodRepository = rentalPeriodRepository;
        this.userRepository = userRepository;
        this.availabilityService = availabilityService;
    }

    @Transactional
    public Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
            return cartRepository.save(Cart.builder().user(user).build());
        });
    }

    @Transactional
    public Cart addItem(UUID userId, UUID productVariantId, int quantity, LocalDate startDate, LocalDate endDate, Long rentalPeriodId) {
        validateDateRange(startDate, endDate);
        Cart cart = getOrCreateCart(userId);
        ProductVariant variant = productVariantRepository.findById(productVariantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
        RentalPeriod rentalPeriod = resolveRentalPeriod(rentalPeriodId);

        availabilityService.ensureAvailable(productVariantId, startDate, endDate, quantity, null);

        cart.getItems().add(CartItem.builder()
                .cart(cart).productVariant(variant).rentalPeriod(rentalPeriod)
                .quantity(quantity).startDate(startDate).endDate(endDate).build());
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart updateItem(UUID userId, Long itemId, int quantity, LocalDate startDate, LocalDate endDate, Long rentalPeriodId) {
        validateDateRange(startDate, endDate);
        Cart cart = getOrCreateCart(userId);
        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        availabilityService.ensureAvailable(item.getProductVariant().getId(), startDate, endDate, quantity, null);

        item.setQuantity(quantity);
        item.setStartDate(startDate);
        item.setEndDate(endDate);
        item.setRentalPeriod(resolveRentalPeriod(rentalPeriodId));
        cartItemRepository.save(item);
        return cart;
    }

    @Transactional
    public void removeItem(UUID userId, Long itemId) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        cart.getItems().remove(item);
        cartItemRepository.delete(item);
    }

    @Transactional
    public void clear(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private RentalPeriod resolveRentalPeriod(Long rentalPeriodId) {
        if (rentalPeriodId == null) {
            return null;
        }
        return rentalPeriodRepository.findById(rentalPeriodId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental period not found"));
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (!endDate.isAfter(startDate)) {
            throw new BadRequestException("endDate must be after startDate");
        }
    }
}
