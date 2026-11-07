# Radha Madhab SIM SMS Sender — Android Companion App

This native Android application allows shopkeepers to send customer due reminders directly from their **own Android smartphone SIM card** (Jio, Airtel, Vi, BSNL) without paying for external SMS gateways or configuring SMS API keys.

---

## 🚀 Features

1. **Direct SIM Sending**: Uses your phone's carrier SIM card SMS plan with 100% zero third-party gateway fees.
2. **Real-time Website Connection**: Automatically connects to the Radha Madhab Online Center website backend to receive pending due entry alerts.
3. **Instant Notification**: When you click **"Confirm Due"** on the website, a notification appears on your phone showing:
   - Shop Name
   - Customer Name
   - Customer Mobile
   - Due Amount
   - Action buttons: **[View Details]**, **[Send SMS]**, **[Cancel]**
4. **Multilingual SMS**:
   - **Bengali (বাংলা)**: `"প্রিয় {{customer_name}}, আপনার {{shop_name}} দোকানে ₹{{due_amount}} টাকা ধার বাকি রয়েছে। অনুগ্রহ করে সময়মতো টাকা পরিশোধ করুন। ধন্যবাদ।"`
   - **English**: `"Dear {{customer_name}}, you have ₹{{due_amount}} pending at {{shop_name}}. Please make the payment at your earliest convenience. Thank you."`
   - **Hindi (हिन्दी)**: `"प्रिय {{customer_name}}, {{shop_name}} में आपका ₹{{due_amount}} बकाया है। कृपया समय पर भुगतान करें। धन्यवाद।"`
5. **Real-time Status Sync**: Reports status (`Pending` ➔ `Approved` ➔ `Sending` ➔ `Sent` ➔ `Failed`) back to the website.

---

## 🛠️ How to Build & Install in Android Studio

1. Open **Android Studio** (Hedgehog, Iguana, or newer).
2. Click **Open** and select the `/android` directory.
3. Wait for Gradle sync to complete.
4. Connect your Android phone via USB (with Developer options & USB Debugging enabled) or use an emulator.
5. In `MainActivity.kt` or `app/src/main/res/values/strings.xml`, set your website server URL (e.g. `http://192.168.1.100:3000` or your production domain).
6. Click **Run ▶** to install on your smartphone.
7. Grant the **SMS Permission** when prompted.

---

## 📱 PWA / Mobile Web Alternative
You can also use the built-in **Android SIM App** view directly on your mobile browser or install it as a PWA from the website header by clicking `📱 Android App`.
