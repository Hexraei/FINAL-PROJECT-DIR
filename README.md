# Import & Export Data Entry Application - User Guide

Welcome to the Import & Export Data Entry Application. This guide will walk you through all the features of the application, from creating your account to viewing and exporting reports.

## Table of Contents

1.  [Accessing the Application](#1-accessing-the-application)
2.  [User Roles](#2-user-roles)
3.  [Creating an Account (Registration)](#3-creating-an-account-registration)
4.  [Logging In](#4-logging-in)
5.  [Password Reset](#5-password-reset)
6.  [For Official Users: The Dashboard](#6-for-official-users-the-dashboard)
    -   [Adding a New Data Entry](#adding-a-new-data-entry)
    -   [Viewing, Editing, and Deleting Entries](#viewing-editing-and-deleting-entries)
7.  [For All Users: The Reports Page](#7-for-all-users-the-reports-page)
    -   [Filtering Reports](#filtering-reports)
    -   [Viewing Charts and Data Tables](#viewing-charts-and-data-tables)
    -   [Exporting Data to Excel](#exporting-data-to-excel)
8.  [For Administrators: Product Management (Backdoor)](#8-for-administrators-product-management-backdoor)
    -   [Accessing the Product Management Page](#accessing-the-product-management-page)
    -   [Adding and Deleting Master Products](#adding-and-deleting-master-products)

---

### 1. Accessing the Application

You can access the application by navigating to the following web address in your browser:

**https://data-entry-idyo.onrender.com** *(<- Replace this with your actual live URL)*

The first page you will see is the login screen.

### 2. User Roles

The application has two types of users:

-   **General User:** Can view and export reports. This role is for team members who need to see data but not enter or change it.
-   **Official:** Can do everything a General User can, plus add, edit, and delete data entries. This role is for data entry clerks and managers.

### 3. Creating an Account (Registration)

If you don't have an account, you can create one from the login page.

1.  Click the **"Register here"** link.
2.  Fill in your desired `Username`, `Email`, and `Password`.
3.  Select your role from the `Role` dropdown.
    -   If you select **"General User"**, you can proceed to register.
    -   If you select **"Official"**, a new field will appear. You must enter the **Official Key** provided by your administrator to complete registration.
4.  Click the **"Register"** button. You will be automatically logged in.

 *(Note: It's highly recommended you take screenshots of your actual application and replace these placeholder image links.)*

### 4. Logging In

On the main page, enter your registered `Email` and `Password` and click **"Sign In"**.

-   If you are an **Official**, you will be taken directly to the **Official Dashboard**.
-   If you are a **General User**, you will be taken to the **Reports Page**.

### 5. Password Reset

If you forget your password, you can reset it securely.

1.  On the login page, click **"Forgot Password?"**.
2.  Enter the email address associated with your account and click **"Send OTP"**.
3.  You will receive an email containing a 6-digit One-Time Password (OTP).
4.  You will be redirected to the "Reset Password" page. Enter your `Email`, the `OTP` you received, and your `New Password`.
5.  Click **"Reset Password"**. You can now log in with your new password.

### 6. For Official Users: The Dashboard

This is the main page for Officials, where data is managed.

#### Adding a New Data Entry

1.  In the **"Add New Entry"** form, begin typing a **Product Name**. A dropdown list of existing master products will appear. You can select one or type a new one.
2.  Enter the **Quantity** (in kg).
3.  Select the **Date** of the entry. You can only select today's date or yesterday's date.
4.  Click **"Submit Entry"**. The new record will appear in the "Recent Entries" table below.

#### Viewing, Editing, and Deleting Entries

The **"Recent Entries"** table shows all submitted data.

-   **Time Limit:** You can only edit or delete an entry within **48 hours** of its original submission. After 48 hours, the record is locked, and the "Edit" and "Delete" buttons will be replaced with a "Locked" status.
-   **Edit:** Click the **"Edit"** button on a row. A pop-up window will appear, allowing you to change the Product Name, Quantity, or Date. Click "Save" to confirm.
-   **Delete:** Click the **"Delete"** button. A browser confirmation pop-up will appear. Click "OK" to permanently delete the record.



### 7. For All Users: The Reports Page

This page provides a comprehensive view of all data in the system. Officials can access this page by clicking the "View Reports" button from their dashboard. General Users are taken here directly after logging in.

#### Filtering Reports

At the top of the page, you can filter the data shown in the charts and table.

-   **Product:** Select a specific product from the dropdown to see only its data.
-   **Start Date / End Date:** Select a date range to view records from a specific period.
-   Click the **"Filter"** button to apply your selections.
-   Click the **"Reset"** button to clear all filters and view all data.

#### Viewing Charts and Data Tables

-   **Charts:** The Pie and Bar charts provide a visual summary of the total quantity for each product based on your current filters.
-   **Data Table:** The table at the bottom shows the detailed records matching your filters. It includes the product name, quantity, date, and who submitted it. If a record has been modified, you can click the **"View (X)"** button to see a detailed history of all changes, including what was changed, by whom, and when.



#### Exporting Data to Excel

You can download a report of the currently filtered data as a professional Excel (`.xlsx`) file.

1.  Apply any filters you need (by product or date range).
2.  Click the green **"Export"** button.
3.  Your browser will download an Excel file containing all the data currently visible in the data table.

### 8. For Administrators: Product Management (Backdoor)

This is a special administrative feature for managing the master list of products that appear in the data entry dropdown. This ensures consistency in product naming.

#### Accessing the Product Management Page

Only Officials can access this page, and only by using a special password.

1.  Go to the main **Login** page.
2.  Enter the email address of a registered **Official** user.
3.  In the password field, enter the special **Backdoor Password** provided by the system administrator.
4.  Click **"Sign In"**. You will be taken to the Product Management page.

#### Adding and Deleting Master Products

-   **Add a Product:** In the "Add New Master Product" form, type the official name of a new product and click **"Add Product"**. It will now be available for selection on the data entry page.
-   **Delete a Product:** In the "Existing Master Products" list, click the red **"×"** button next to a product name.
    -   A confirmation prompt will appear, requiring you to type the full product name to confirm the deletion. This is a safety measure to prevent accidental deletions.
    -   **Note:** You cannot delete a product that has already been used in a data entry report. This is to maintain data integrity.

---
*This guide was last updated on October 20, 2025.*
