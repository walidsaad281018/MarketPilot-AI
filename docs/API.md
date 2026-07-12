# API Specification

# MarketPilot AI

Version: 0.1 Alpha

---

# Overview

The API connects the frontend with market data, AI analysis and user information.

The MVP uses REST APIs.

---

# Base URL

/api

---

# Authentication

Version 1

Public endpoints only.

Version 2

Pi Authentication

JWT

User Accounts

---

# Endpoints

## GET /dashboard

Returns:

Top 3 Crypto

Top 3 Stocks

Top 3 ETFs

Latest Market Summary

---

## GET /opportunities

Query

category

Possible values

crypto

stocks

etf

Returns

Top 20 opportunities.

---

## GET /asset/{symbol}

Returns

Asset Details

Current Price

AI Score

Confidence

Risk

Reasons

Technical Indicators

Historical Recommendations

---

## GET /recommendation/{id}

Returns

Recommendation details.

Performance.

Success status.

---

## GET /statistics

Returns

Total recommendations

Success rate

Average return

Pending recommendations

---

## GET /history

Returns

Historical recommendation list.

---

## POST /watchlist

Adds an asset to a watchlist.

---

## DELETE /watchlist/{symbol}

Removes an asset.

---

## GET /watchlist

Returns user favorites.

---

# Response Example

{
    "symbol":"BTC",
    "score":91,
    "confidence":88,
    "risk":"Low",
    "recommendation":"★★★★★"
}

---

# Error Codes

200

Success

400

Invalid Request

404

Not Found

429

Rate Limit

500

Server Error

---

# Version Roadmap

Version 1

Public market data.

Version 2

Pi Login.

Watchlists.

Version 3

Premium endpoints.

Portfolio analytics.
