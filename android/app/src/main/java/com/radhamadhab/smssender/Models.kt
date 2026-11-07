package com.radhamadhab.smssender

import com.google.gson.annotations.SerializedName

enum class SimSmsStatus {
    @SerializedName("Pending")
    PENDING,
    @SerializedName("Approved")
    APPROVED,
    @SerializedName("Sending")
    SENDING,
    @SerializedName("Sent")
    SENT,
    @SerializedName("Failed")
    FAILED
}

data class SimSmsRequest(
    val id: String,
    val partyId: String,
    val entryId: String?,
    val customerName: String,
    val customerMobile: String,
    val shopName: String,
    val dueAmount: Double,
    val remainingBalance: Double,
    val transactionType: String, // "Due" or "Payment"
    val dateTime: String,
    var status: SimSmsStatus,
    var message: String,
    val language: String? = "bn",
    val sentAt: String? = null,
    val error: String? = null,
    val createdAt: String
)

data class SimSmsQueueResponse(
    val success: Boolean,
    val queue: List<SimSmsRequest>?
)

data class UpdateStatusRequest(
    val id: String,
    val status: String,
    val error: String? = null
)

data class BaseResponse(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null
)
