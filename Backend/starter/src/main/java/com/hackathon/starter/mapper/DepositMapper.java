package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.DepositTransactionResponse;
import com.hackathon.starter.dto.response.SecurityDepositResponse;
import com.hackathon.starter.entity.DepositTransaction;
import com.hackathon.starter.entity.SecurityDeposit;
import org.springframework.stereotype.Component;

@Component
public class DepositMapper {

    public SecurityDepositResponse toResponse(SecurityDeposit deposit) {
        return new SecurityDepositResponse(deposit.getId(), deposit.getOrder().getId(), deposit.getAmount(),
                deposit.getStatus(), deposit.getCreatedAt());
    }

    public DepositTransactionResponse toResponse(DepositTransaction txn) {
        return new DepositTransactionResponse(txn.getId(), txn.getType(), txn.getAmount(), txn.getReason(),
                txn.getRazorpayRefundId(), txn.getCreatedAt());
    }
}
