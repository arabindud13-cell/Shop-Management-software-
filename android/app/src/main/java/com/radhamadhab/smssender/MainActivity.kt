package com.radhamadhab.smssender

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telephony.SmsManager
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var apiClient: ApiClient
    private var backendUrl = "http://localhost:3000"
    private var pollingJob: Job? = null
    private val pendingList = mutableListOf<SimSmsRequest>()

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val smsGranted = permissions[Manifest.permission.SEND_SMS] ?: false
        if (smsGranted) {
            Toast.makeText(this, "SMS Permission Granted! Ready to send.", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "SMS Permission required to send reminders via SIM.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Read saved backend URL if configured
        val prefs = getSharedPreferences("radhamadhab_prefs", Context.MODE_PRIVATE)
        backendUrl = prefs.getString("backend_url", "http://localhost:3000") ?: "http://localhost:3000"
        apiClient = ApiClient(backendUrl)

        checkPermissions()
        startPollingQueue()
    }

    private fun checkPermissions() {
        val permissions = mutableListOf(Manifest.permission.SEND_SMS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            requestPermissionLauncher.launch(needed.toTypedArray())
        }
    }

    private fun startPollingQueue() {
        pollingJob?.cancel()
        pollingJob = lifecycleScope.launch {
            while (isActive) {
                try {
                    val requests = apiClient.getPendingRequests()
                    if (requests.isNotEmpty() && requests.size > pendingList.size) {
                        // New due entry detected from website!
                        val latest = requests.first()
                        showNewDueNotificationDialog(latest)
                    }
                    pendingList.clear()
                    pendingList.addAll(requests)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                delay(10000) // Poll every 10 seconds
            }
        }
    }

    /**
     * Requirement:
     * When a new due entry is confirmed on the website, display a notification:
     * New Customer Due Entry
     * Shop Name: Radha Madhab Online Center
     * Customer Name: Rahul Das
     * Customer Mobile: 9123456780
     * Due Amount: ₹500
     * Buttons: View Details, Send SMS, Cancel
     */
    private fun showNewDueNotificationDialog(request: SimSmsRequest) {
        val messageBody = """
            Shop Name: ${request.shopName}
            Customer Name: ${request.customerName}
            Customer Mobile: ${request.customerMobile}
            Due Amount: ₹${request.dueAmount}
            Date: ${request.dateTime}
        """.trimIndent()

        MaterialAlertDialogBuilder(this)
            .setTitle("🔔 New Customer Due Entry")
            .setMessage(messageBody)
            .setPositiveButton("Send SMS") { _, _ ->
                showSendSmsConfirmationDialog(request)
            }
            .setNeutralButton("View Details") { _, _ ->
                showRequestDetailsDialog(request)
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }

    private fun showSendSmsConfirmationDialog(request: SimSmsRequest) {
        val dialogView = layoutInflater.inflate(android.R.layout.simple_list_item_1, null)

        MaterialAlertDialogBuilder(this)
            .setTitle("📱 Confirm Send SMS via SIM")
            .setMessage("Send due reminder to ${request.customerName} (+91 ${request.customerMobile}) using your device SIM card?")
            .setPositiveButton("Confirm & Send") { _, _ ->
                sendSmsThroughSim(request)
            }
            .setNegativeButton("Back", null)
            .show()
    }

    private fun showRequestDetailsDialog(request: SimSmsRequest) {
        val fullInfo = """
            Customer: ${request.customerName}
            Mobile: +91 ${request.customerMobile}
            Shop: ${request.shopName}
            Transaction: ${request.transactionType}
            Amount: ₹${request.dueAmount}
            Remaining Balance: ₹${request.remainingBalance}
            
            Message Preview:
            ${request.message}
        """.trimIndent()

        MaterialAlertDialogBuilder(this)
            .setTitle("Customer Due Details")
            .setMessage(fullInfo)
            .setPositiveButton("Send SMS Now") { _, _ ->
                sendSmsThroughSim(request)
            }
            .setNegativeButton("Close", null)
            .show()
    }

    private fun sendSmsThroughSim(request: SimSmsRequest) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            checkPermissions()
            return
        }

        lifecycleScope.launch {
            apiClient.updateStatus(request.id, SimSmsStatus.SENDING)
            try {
                val cleanPhone = request.customerMobile.replace(Regex("[^0-9]"), "")
                val target = if (cleanPhone.length == 10) "+91$cleanPhone" else "+$cleanPhone"

                val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    getSystemService(SmsManager::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    SmsManager.getDefault()
                }

                val parts = smsManager.divideMessage(request.message)
                smsManager.sendMultipartTextMessage(target, null, parts, null, null)

                apiClient.updateStatus(request.id, SimSmsStatus.SENT)
                Toast.makeText(this@MainActivity, "SMS sent to ${request.customerName} via Phone SIM!", Toast.LENGTH_LONG).show()
            } catch (e: Exception) {
                apiClient.updateStatus(request.id, SimSmsStatus.FAILED, e.message)
                Toast.makeText(this@MainActivity, "Failed to send SMS: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        pollingJob?.cancel()
    }
}
