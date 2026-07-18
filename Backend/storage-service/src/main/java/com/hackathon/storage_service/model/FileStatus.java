package com.hackathon.storage_service.model;

public enum FileStatus {
    /** Upload URL was generated, but bytes haven't landed on disk yet. */
    PENDING,
    /** Bytes are on disk; safe to download. */
    UPLOADED
}
