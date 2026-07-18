package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.AuthProvider;
import com.hackathon.starter.enums.Role;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Plain getter/setter class (not a record) because ModelMapper's reflection-based
 * mapping needs mutable bean properties to populate from the User entity - see UserMapper.
 */
@Getter
@Setter
@NoArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private AuthProvider authProvider;
    private boolean verified;
    private UUID profileImageFileId;
    private LocalDateTime createdAt;
}
