# 🍽️ Restaurant Affiliate System – React Admin Template

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](#)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple.svg)](#)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Price](https://img.shields.io/badge/price-FREE-0098f7.svg)](#)
[![Download ZIP](https://img.shields.io/badge/Download-ZIP-blue?style=flat-square\&logo=github)](#)

A modern **Restaurant Affiliate System** built with React that enables restaurants to run a successful referral-based marketing program. Customers can sign up, receive a unique referral code, and earn rewards. For every **5 successful referrals**, customers receive a **$10 discount coupon**, redeemable at the restaurant by showing the code to the restaurant manager.

✨ Support us! If you like this project, click the ⭐ (Top right) and help it grow.

---

## Table of Contents

* [Getting Started](#getting-started)
* [System Overview](#system-overview)
* [Key Features](#key-features)
* [User Roles](#user-roles)
* [Referral & Reward Logic](#referral--reward-logic)
* [Admin Dashboard Modules](#admin-dashboard-modules)
* [Technology Stack](#technology-stack)
* [Browser Support](#browser-support)
* [Future Enhancements](#future-enhancements)
* [Issues](#issues)
* [License](#license)

---

## 🚀 Getting Started

1. Clone the repository

```bash
git clone https://github.com/your-org/restaurant-affiliate-system.git
```

2. Navigate to the project folder

```bash
cd restaurant-affiliate-system
```

3. Install dependencies

```bash
yarn
```

4. Run the project

```bash
yarn start
```

The app will be available at:

```text
http://localhost:3000
```

---

## System Overview

The **Restaurant Affiliate System** is designed to help restaurants increase customer acquisition through word-of-mouth marketing. Customers act as affiliates by referring friends and family using a unique referral code. The system tracks referrals, validates successful signups or orders, and automatically rewards affiliates with discount coupons.

Restaurants can manage the entire program through a centralized admin dashboard.

---

## Key Features

* Customer signup and referral system
* Unique referral code generation
* Automated referral tracking
* Reward-based coupon generation
* $10 discount coupons after every 5 successful referrals
* Admin dashboard for restaurants
* Coupon validation by restaurant manager
* Responsive and modern UI
* Secure and scalable architecture

---

## User Roles

### 1. Customer / Affiliate

* Sign up to the platform
* Receive a unique referral code
* Share referral code with others
* Track referral progress (e.g., 2/5 referrals completed)
* Receive a $10 coupon after every 5 successful referrals
* Redeem coupon at the restaurant

### 2. Restaurant Manager

* View active affiliates and referrals
* Verify and validate coupon codes
* Apply $10 discount to customer orders
* Track redeemed and expired coupons

### 3. Admin (System Owner)

* Manage restaurants
* Manage users and affiliates
* Configure referral rules and rewards
* Monitor system-wide performance
* Generate reports and analytics

---

## Referral & Reward Logic

1. Customer signs up and receives a unique referral code
2. New users sign up or place orders using the referral code
3. Each successful referral is recorded
4. Once **5 referrals** are completed:

   * A **$10 discount coupon** is generated
   * Coupon is assigned to the affiliate account
5. Customer shows the coupon code to the restaurant manager
6. Manager validates the coupon and applies the discount
7. Coupon status is updated as **Redeemed**

---

## Admin Dashboard Modules

### Authentication Module

* Secure login and role-based access

### Affiliate Management

* View registered affiliates
* Referral counts and status
* Reward eligibility tracking

### Coupon Management

* Auto-generate coupons
* Coupon status (Active, Redeemed, Expired)
* Manual validation support

### Restaurant Management

* Add / update restaurant profiles
* Assign managers
* Track coupon redemptions per restaurant

### Analytics & Reports

* Total referrals
* Conversion rate
* Coupons issued vs redeemed
* Top-performing affiliates

---

## 🧰 Technology Stack

* React (Hooks API)
* Bootstrap 5
* Redux Toolkit & Context API
* React Router
* REST API / Node.js backend (recommended)
* MySQL / PostgreSQL database
* JWT-based authentication
* Twilio
* Google Firebase

---

## Browser Support

* Chrome
* Edge
* Firefox
* Safari
* Opera

---

## Future Enhancements

* QR-code based coupon redemption
* Mobile app (React Native)
* Wallet-based reward system
* Multi-restaurant affiliate accounts
* Email & SMS notifications
* Fraud detection for referrals

---

## 🐞 Issues

If you find a bug or want to request a feature, please create an issue in the GitHub repository. We appreciate your feedback.

---

## 📄 License

* Licensed under the MIT License
* © Kokri Web Solutions
* Author: Ranjeev Wassan

---

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes

```bash
git commit -m "Add your feature"
```

4. Push to the branch

```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request

---

## 📦 Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Restaurant Affiliate System
```

---

Happy building 🚀
