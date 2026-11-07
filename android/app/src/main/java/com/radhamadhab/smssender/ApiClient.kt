package com.radhamadhab.smssender

import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ApiClient(private var baseUrl: String) {

    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    fun updateBaseUrl(newUrl: String) {
        baseUrl = if (newUrl.endsWith("/")) newUrl.dropLast(1) else newUrl
    }

    suspend fun getPendingRequests(): List<SimSmsRequest> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/api/sim-sms/pending")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val parsed = gson.fromJson(body, SimSmsQueueResponse::class.java)
                parsed.queue ?: emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun updateStatus(id: String, status: SimSmsStatus, error: String? = null): Boolean =
        withContext(Dispatchers.IO) {
            try {
                val jsonPayload = gson.toJson(
                    mapOf(
                        "id" to id,
                        "status" to when (status) {
                            SimSmsStatus.PENDING -> "Pending"
                            SimSmsStatus.APPROVED -> "Approved"
                            SimSmsStatus.SENDING -> "Sending"
                            SimSmsStatus.SENT -> "Sent"
                            SimSmsStatus.FAILED -> "Failed"
                        },
                        "error" to error
                    )
                )

                val body = jsonPayload.toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("$baseUrl/api/sim-sms/status")
                    .post(body)
                    .build()

                client.newCall(request).execute().use { response ->
                    response.isSuccessful
                }
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
}
