package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.AddressResponse;
import com.hackathon.starter.entity.Address;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    public AddressResponse toResponse(Address address) {
        return new AddressResponse(address.getId(), address.getLabel(), address.getLine1(), address.getLine2(),
                address.getCity(), address.getState(), address.getPostalCode(), address.getCountry(),
                address.isDefault(), address.getCreatedAt());
    }
}
