package com.hackathon.starter.enums;

/** Append-only ledger entry type - see DepositTransaction / DB_SCHEMA.md §2.7. */
public enum DepositTxnType {
    HOLD,
    DEDUCTION,
    REFUND
}
