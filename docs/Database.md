# Database Design

# MarketPilot AI

Version: 0.1 Alpha

---

# Overview

The database stores users, assets, AI recommendations, watchlists and historical performance.

The design prioritizes transparency and scalability.

---

# Database Technology

PostgreSQL

(Using Supabase during MVP)

---

# Entity Relationship Overview

Users
│
├── Watchlists
│
├── Recommendations
│
└── User Settings

Assets
│
├── Prices
│
├── Technical Indicators
│
└── Recommendation History

---

# Table: users

Purpose:

Stores registered users.

Fields:

- id (UUID)
- pi_uid
- username
- email
- created_at
- updated_at

---

# Table: assets

Purpose:

Stores all supported investment assets.

Fields:

- id
- symbol
- name
- asset_type
- market
- exchange
- active

Example:

BTC

ETH

AAPL

MSFT

SPY

VOO

---

# Table: prices

Purpose:

Historical market prices.

Fields:

- id
- asset_id
- price
- volume
- market_cap
- timestamp

---

# Table: technical_indicators

Purpose:

Stores calculated indicators.

Fields:

- id
- asset_id
- rsi
- macd
- ema20
- ema50
- sma200
- volume_score
- momentum_score
- calculated_at

---

# Table: recommendations

Purpose:

Stores every AI recommendation.

Fields:

- id
- asset_id
- ai_score
- confidence
- recommendation
- risk_level
- reason_1
- reason_2
- reason_3
- created_at

---

# Table: recommendation_results

Purpose:

Tracks recommendation performance.

Fields:

- id
- recommendation_id
- evaluation_date
- price_at_recommendation
- current_price
- percentage_change
- outcome

Possible outcome values:

SUCCESS

FAILURE

PENDING

---

# Table: watchlists

Purpose:

Stores user favorites.

Fields:

- id
- user_id
- asset_id
- created_at

---

# Table: daily_rankings

Purpose:

Stores Top 20 opportunities.

Fields:

- id
- ranking_date
- asset_id
- category
- position
- ai_score

---

# Relationships

User

↓

Watchlist

↓

Asset

↓

Recommendation

↓

Recommendation Result

---

# Future Tables

news_sentiment

portfolio

notifications

subscriptions

premium_features

audit_logs

---

# Database Principles

- No duplicated data
- Every recommendation is permanent
- Every prediction is measurable
- Every score is traceable
- Historical data is never deleted
