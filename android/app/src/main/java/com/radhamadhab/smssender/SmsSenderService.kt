package com.radhamadhab.smssender

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class SmsSenderService : Service() {

    private val scope = CoroutineScope(Dispatchers.Main)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val requestId = intent?.getStringExtra("EXTRA_REQUEST_ID") ?: return START_NOT_STICKY
        val phone = intent.getStringExtra("EXTRA_PHONE") ?: return START_NOT_STICKY
        val message = intent.getStringExtra("EXTRA_MESSAGE") ?: return START_NOT_STICKY
        val backendUrl = intent.getStringExtra("EXTRA_BACKEND_URL") ?: "http://localhost:3000"
        val simSlot = intent.getIntExtra("EXTRA_SIM_SLOT", 0)

        startForegroundNotification("Sending SIM SMS...", "Sending reminder to $phone")

        scope.launch {
            val apiClient = ApiClient(backendUrl)
            // 1. Mark as SENDING
            apiClient.updateStatus(requestId, SimSmsStatus.SENDING)

            try {
                sendDirectSms(phone, message, simSlot)
                // 2. Mark as SENT
                apiClient.updateStatus(requestId, SimSmsStatus.SENT)
                showResultNotification("SMS Sent Successfully", "Delivered to $phone via phone SIM.")
            } catch (e: Exception) {
                e.printStackTrace()
                // 3. Mark as FAILED
                apiClient.updateStatus(requestId, SimSmsStatus.FAILED, e.message)
                showResultNotification("SMS Failed", "Could not send to $phone: ${e.message}")
            } finally {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf(startId)
            }
        }

        return START_NOT_STICKY
    }

    private fun sendDirectSms(phoneNumber: String, text: String, simSlot: Int) {
        val cleanPhone = phoneNumber.replace(Regex("[^0-9]"), "")
        val targetNumber = if (cleanPhone.length == 10) "+91$cleanPhone" else "+$cleanPhone"

        val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            applicationContext.getSystemService(SmsManager::class.java)
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }

        // Support multipart SMS for long Bengali / Unicode texts
        val parts = smsManager.divideMessage(text)
        smsManager.sendMultipartTextMessage(targetNumber, null, parts, null, null)
    }

    private fun startForegroundNotification(title: String, body: String) {
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun showResultNotification(title: String, body: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setAutoCancel(true)
            .build()
        manager.notify(NOTIFICATION_ID + 1, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SIM SMS Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID = "SIM_SMS_SERVICE_CHANNEL"
        const val NOTIFICATION_ID = 2001
    }
}
