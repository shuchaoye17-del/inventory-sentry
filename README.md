# 🛡️ Inventory Sentry — Supplier Feed Validation Layer for Shopify

## 🚨 The Problem
Have you ever had a supplier’s inventory suddenly drop to 0? 
It causes customer complaints, wasted ad spend, and stockouts. 

## ✅ The Solution
Inventory Sentry is a lightweight safety layer that scans your supplier’s inventory file **BEFORE** it syncs to Shopify. 
*   **Catch dangerous changes:** Stock drops (e.g., 300 to 10), unexpected zeros, and SKU mismatches.
*   **No AI hallucinations:** 100% fixed rule-based logic.
*   **Privacy first:** All files are processed in your browser. **Nothing is uploaded to any server.**
*   **Manual control:** It recommends "Hold for review." It does NOT block or change anything automatically.

## 📊 Proof of Concept (Demo)
In our demo scan, Inventory Sentry flagged:
- **412** of 430 previously in-stock SKUs suddenly becoming zero.
- **375** of 1,500 SKUs missing.
- Quantity changes from 100 to 10.

## 🚀 Looking for Pilot Users
I built this because I experienced supplier data issues myself. I’m offering **free pilot scans** right now. 
Just send me your previous inventory file and your new supplier file. I'll run the scan and send you the risk report.

## ⚙️ How to Test
1. Download the `Inventory-Sentry-Pilot.exe` from the Releases page.
2. Complete the Windows installer.
3. Open the app, enter supplier name, upload both files, map SKU and Quantity columns.
4. Run Safety Check.

**Important:** The pilot installer is unsigned. Files stay on your machine. It does not write to Shopify.<img width="1966" height="1150" alt="file" src="https://github.com/user-attachments/assets/a6f5137c-ccce-4e88-b992-a644ed9761c2" />
<img width="1968" height="1156" alt="file (1)" src="https://github.com/user-attachments/assets/f0975eb2-443f-44d5-b794-0ada8dce4080" />
