# AI Engine Specification

# MarketPilot AI

Version: 0.1 Alpha

---

# Overview

The MarketPilot Intelligence Engine (MIE) evaluates financial assets using transparent scoring rather than black-box predictions.

The objective is to identify high-quality investment opportunities while explaining every recommendation.

The AI never guarantees profits.

It assists investors by ranking opportunities based on measurable signals.

---

# AI Philosophy

Transparency over complexity.

Every recommendation must be understandable.

Every recommendation must be measurable.

Every recommendation must be traceable.

---

# Analysis Pipeline

Market Data

↓

Data Validation

↓

Technical Analysis

↓

Fundamental Analysis

↓

News Sentiment

↓

Risk Analysis

↓

Scoring Engine

↓

Recommendation Engine

↓

Transparency Engine

---

# Step 1

Data Validation

Checks:

- Missing data
- Invalid values
- API freshness
- Trading availability

If validation fails:

No recommendation is generated.

---

# Step 2

Technical Analysis

Indicators

- RSI
- MACD
- EMA20
- EMA50
- SMA200
- Volume
- Momentum

---

# Step 3

Fundamental Analysis

Stocks & ETFs only.

Metrics

- Market Cap
- P/E Ratio
- Dividend Yield
- Revenue Growth (future)

---

# Step 4

News Sentiment

Categories

Positive

Neutral

Negative

Future versions may use LLM summarization.

---

# Step 5

Risk Engine

Outputs

Low

Medium

High

Risk is based on

- Volatility
- Liquidity
- Momentum stability

---

# Step 6

Scoring Engine

Weights

Technical Analysis: 35%

Momentum: 20%

Volume: 15%

Risk: 15%

News Sentiment: 15%

Total = 100%

---

# AI Score

Range

0–100

Interpretation

90–100

Exceptional Opportunity

80–89

Strong Opportunity

70–79

Good Opportunity

60–69

Watchlist

Below 60

Not Recommended

---

# Confidence

Range

0–100%

Confidence is calculated from

- Signal consistency
- Indicator agreement
- Data quality

Confidence does NOT represent certainty.

---

# Recommendation Levels

⭐⭐⭐⭐⭐

Exceptional Opportunity

⭐⭐⭐⭐

Strong Opportunity

⭐⭐⭐

Watchlist

⭐⭐

High Risk

⭐

Avoid

---

# Explainability

Every recommendation must include exactly three reasons.

Example

1. Strong upward trend

2. High trading volume

3. Positive market sentiment

---

# Transparency Engine

Every recommendation is permanently stored.

Every recommendation receives a Recommendation ID.

Example

MP-20260712-0001

Every recommendation can later be evaluated.

Possible outcomes

SUCCESS

FAILURE

PENDING

---

# Learning Strategy

Version 1

Rule-based scoring.

Version 2

Machine Learning assistance.

Version 3

Adaptive weighting.

---

# AI Principles

Never promise profits.

Never hide uncertainty.

Always explain recommendations.

Always display confidence.

Always display risk.

Always remain transparent.
