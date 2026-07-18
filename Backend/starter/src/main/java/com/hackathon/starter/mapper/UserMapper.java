package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.UserResponse;
import com.hackathon.starter.entity.User;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

/**
 * Isolates ModelMapper usage from services - keeps entity<->DTO conversion in one place
 * so field-name drift between User and UserResponse fails obviously here, not silently
 * in a scattered set of service methods.
 */
@Component
public class UserMapper {

    private final ModelMapper modelMapper;

    public UserMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    public UserResponse toUserResponse(User user) {
        return modelMapper.map(user, UserResponse.class);
    }
}
