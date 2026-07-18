package com.hackathon.starter.service;

import com.hackathon.starter.entity.Address;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.AddressRepository;
import com.hackathon.starter.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Every method scopes by userId - never trust a customer-supplied address id alone. */
@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<Address> listForUser(UUID userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId);
    }

    public Address getOwned(UUID id, UUID userId) {
        return addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
    }

    @Transactional
    public Address create(UUID userId, String label, String line1, String line2, String city,
                           String state, String postalCode, String country) {
        var user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean isFirstAddress = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId).isEmpty();
        Address address = Address.builder()
                .user(user).label(label).line1(line1).line2(line2).city(city).state(state)
                .postalCode(postalCode).country(country)
                .isDefault(isFirstAddress)
                .build();
        return addressRepository.save(address);
    }

    @Transactional
    public Address update(UUID id, UUID userId, String label, String line1, String line2, String city,
                           String state, String postalCode, String country) {
        Address address = getOwned(id, userId);
        address.setLabel(label);
        address.setLine1(line1);
        address.setLine2(line2);
        address.setCity(city);
        address.setState(state);
        address.setPostalCode(postalCode);
        address.setCountry(country);
        return addressRepository.save(address);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        Address address = getOwned(id, userId);
        addressRepository.delete(address);
    }

    /** Only one default address per user (DB_SCHEMA.md §4) - unset the previous default in the same transaction. */
    @Transactional
    public Address markDefault(UUID id, UUID userId) {
        listForUser(userId).forEach(existing -> {
            if (existing.isDefault()) {
                existing.setDefault(false);
                addressRepository.save(existing);
            }
        });
        Address address = getOwned(id, userId);
        address.setDefault(true);
        return addressRepository.save(address);
    }
}
