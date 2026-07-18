package com.hackathon.starter.service;

import com.hackathon.starter.entity.Address;
import com.hackathon.starter.entity.Cart;
import com.hackathon.starter.entity.ProductVariant;
import com.hackathon.starter.entity.Quotation;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.RentalOrderLine;
import com.hackathon.starter.entity.RentalPeriod;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.FulfillmentMethod;
import com.hackathon.starter.enums.OrderStatus;
import com.hackathon.starter.exception.BadRequestException;
import com.hackathon.starter.exception.InvalidOrderStateException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.AddressRepository;
import com.hackathon.starter.repository.ProductVariantRepository;
import com.hackathon.starter.repository.RentalOrderRepository;
import com.hackathon.starter.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * The core order lifecycle (SYSTEM_DESIGN.md §4). Every order - cart checkout or quotation
 * confirmation - passes through the same buildOrder(...) line-construction path so pricing/
 * availability rules can't drift between the two entry points (PRD_README.md §2).
 */
@Service
public class OrderService {

    private final RentalOrderRepository rentalOrderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final AvailabilityService availabilityService;
    private final PricingService pricingService;
    private final InvoiceService invoiceService;
    private final CartService cartService;
    private final EmailService emailService;

    public OrderService(RentalOrderRepository rentalOrderRepository, ProductVariantRepository productVariantRepository,
                         AddressRepository addressRepository, UserRepository userRepository,
                         AvailabilityService availabilityService, PricingService pricingService,
                         InvoiceService invoiceService, CartService cartService, EmailService emailService) {
        this.rentalOrderRepository = rentalOrderRepository;
        this.productVariantRepository = productVariantRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.availabilityService = availabilityService;
        this.pricingService = pricingService;
        this.invoiceService = invoiceService;
        this.cartService = cartService;
        this.emailService = emailService;
    }

    /** One line spec shape shared by cart checkout and quotation confirmation. */
    public record LineSpec(UUID productVariantId, int quantity, LocalDate startDate, LocalDate endDate, RentalPeriod rentalPeriod) {
    }

    public RentalOrder getById(UUID id) {
        return rentalOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    public Page<RentalOrder> listForCustomer(UUID customerId, Pageable pageable) {
        return rentalOrderRepository.findByCustomerId(customerId, pageable);
    }

    public Page<RentalOrder> listByStatus(OrderStatus status, Pageable pageable) {
        return rentalOrderRepository.findByStatus(status, pageable);
    }

    public Page<RentalOrder> listAll(Pageable pageable) {
        return rentalOrderRepository.findAll(pageable);
    }

    /** Portal checkout: cart -> RentalOrder in PENDING_ADMIN_CONFIRMATION (PRD_README.md §2 - confirmed before payment). */
    @Transactional
    public RentalOrder checkoutFromCart(UUID customerId, FulfillmentMethod fulfillmentMethod, UUID deliveryAddressId) {
        Cart cart = cartService.getOrCreateCart(customerId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }
        List<LineSpec> lines = cart.getItems().stream()
                .map(item -> new LineSpec(item.getProductVariant().getId(), item.getQuantity(),
                        item.getStartDate(), item.getEndDate(), item.getRentalPeriod()))
                .toList();

        RentalOrder order = buildOrder(customerId, fulfillmentMethod, deliveryAddressId, lines, null,
                OrderStatus.PENDING_ADMIN_CONFIRMATION);
        cartService.clear(customerId);
        return order;
    }

    /** In-store: confirming a Quotation IS the admin-confirmation step, so the order starts CONFIRMED directly (PRD_README.md §4.3). */
    @Transactional
    public RentalOrder createFromQuotation(Quotation quotation, User admin) {
        List<LineSpec> lines = quotation.getLines().stream()
                .map(line -> new LineSpec(line.getProductVariant().getId(), line.getQuantity(),
                        line.getStartDate(), line.getEndDate(), null))
                .toList();

        RentalOrder order = buildOrder(quotation.getCustomer().getId(), FulfillmentMethod.STORE_PICKUP, null,
                lines, quotation, OrderStatus.CONFIRMED);
        order.setConfirmedBy(admin);
        order.setConfirmedAt(LocalDateTime.now());
        order = rentalOrderRepository.save(order);
        invoiceService.generateRentalInvoice(order);
        emailService.sendOrderConfirmedEmail(order);
        return order;
    }

    private RentalOrder buildOrder(UUID customerId, FulfillmentMethod fulfillmentMethod, UUID deliveryAddressId,
                                    List<LineSpec> lineSpecs, Quotation quotation, OrderStatus initialStatus) {
        User customer = userRepository.findById(customerId).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Address deliveryAddress = null;
        if (fulfillmentMethod == FulfillmentMethod.DELIVERY) {
            if (deliveryAddressId == null) {
                throw new BadRequestException("deliveryAddressId is required when fulfillmentMethod is DELIVERY");
            }
            deliveryAddress = addressRepository.findByIdAndUserId(deliveryAddressId, customerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        }

        RentalOrder order = RentalOrder.builder()
                .customer(customer)
                .quotation(quotation)
                .status(initialStatus)
                .fulfillmentMethod(fulfillmentMethod)
                .deliveryAddress(deliveryAddress)
                .subtotalAmount(BigDecimal.ZERO)
                .depositAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .lines(new ArrayList<>())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal deposit = BigDecimal.ZERO;
        for (LineSpec spec : lineSpecs) {
            if (!spec.endDate().isAfter(spec.startDate())) {
                throw new BadRequestException("endDate must be after startDate");
            }
            ProductVariant variant = productVariantRepository.findById(spec.productVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));

            availabilityService.ensureAvailable(spec.productVariantId(), spec.startDate(), spec.endDate(), spec.quantity(), null);

            var pricing = pricingService.resolveLinePricing(spec.productVariantId(), spec.startDate(), spec.endDate(),
                    spec.rentalPeriod(), spec.quantity());

            RentalOrderLine line = RentalOrderLine.builder()
                    .order(order)
                    .productVariant(variant)
                    .rentalPeriod(spec.rentalPeriod())
                    .quantity(spec.quantity())
                    .startDate(spec.startDate())
                    .endDate(spec.endDate())
                    .unitPrice(pricing.unitPrice())
                    .lineTotal(pricing.lineTotal())
                    .build();
            order.getLines().add(line);

            subtotal = subtotal.add(pricing.lineTotal());
            deposit = deposit.add(variant.getProduct().getSecurityDepositAmount().multiply(BigDecimal.valueOf(spec.quantity())));
        }

        order.setSubtotalAmount(subtotal);
        order.setDepositAmount(deposit);
        order.setTotalAmount(subtotal.add(deposit));
        return rentalOrderRepository.save(order);
    }

    /** Admin reviews availability/terms and confirms - authoritative re-check happens here, inside this transaction (SYSTEM_DESIGN.md §5.1). */
    @Transactional
    public RentalOrder confirm(UUID orderId, User admin) {
        RentalOrder order = getById(orderId);
        requireStatus(order, OrderStatus.PENDING_ADMIN_CONFIRMATION);

        for (RentalOrderLine line : order.getLines()) {
            availabilityService.ensureAvailable(line.getProductVariant().getId(), line.getStartDate(), line.getEndDate(),
                    line.getQuantity(), order.getId());
        }

        order.setStatus(OrderStatus.CONFIRMED);
        order.setConfirmedBy(admin);
        order.setConfirmedAt(LocalDateTime.now());
        order = rentalOrderRepository.save(order);
        invoiceService.generateRentalInvoice(order);
        emailService.sendOrderConfirmedEmail(order);
        return order;
    }

    @Transactional
    public RentalOrder reject(UUID orderId) {
        RentalOrder order = getById(orderId);
        requireStatus(order, OrderStatus.PENDING_ADMIN_CONFIRMATION);
        order.setStatus(OrderStatus.CANCELLED);
        return rentalOrderRepository.save(order);
    }

    /** Customer can only cancel their own order, and only while it hasn't been confirmed yet. */
    @Transactional
    public RentalOrder cancelOwn(UUID orderId, UUID customerId) {
        RentalOrder order = rentalOrderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        requireStatus(order, OrderStatus.PENDING_ADMIN_CONFIRMATION);
        order.setStatus(OrderStatus.CANCELLED);
        return rentalOrderRepository.save(order);
    }

    /** Generic guarded transition, reused by Payment/Pickup/Return/DepositSettlement services so status-guard logic lives in one place. */
    @Transactional
    public RentalOrder transition(RentalOrder order, OrderStatus expectedCurrent, OrderStatus next) {
        requireStatus(order, expectedCurrent);
        order.setStatus(next);
        return rentalOrderRepository.save(order);
    }

    public void requireStatus(RentalOrder order, OrderStatus expected) {
        if (order.getStatus() != expected) {
            throw new InvalidOrderStateException(
                    "Order must be %s for this action (currently %s)".formatted(expected, order.getStatus()));
        }
    }
}
