# System Architecture

# MarketPilot AI

Version: 0.1 Alpha

---

# 1. Overview

MarketPilot AI is a web application that analyzes financial markets and presents transparent AI-assisted investment research.

The system follows a modular architecture to allow future expansion while keeping the MVP simple.

---

# 2. High-Level Architecture

```
                    User
                      │
                      ▼
             Next.js Frontend
                      │
                      ▼
              Backend API Layer
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  Market APIs    AI Engine     Database
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
              Recommendation Engine
                      │
                      ▼
               Transparency Engine
```

---

# 3. Frontend

Technology:

- Next.js
- React
- TypeScript
- Tailwind CSS

Responsibilities:

- Display market opportunities
- Search assets
- Watchlist
- Asset details
- Transparency dashboard

---

# 4. Backend

Responsibilities:

- Fetch market data
- Calculate AI scores
- Store recommendations
- Expose REST API
- Manage users

---

# 5. AI Engine

The AI Engine evaluates each asset using:

- Technical indicators
- Market momentum
- Volume
- Risk assessment
- News sentiment

Output:

- AI Score
- Confidence
- Recommendation
- Three supporting reasons

---

# 6. Database

Stores:

- Users
- Assets
- Market prices
- Recommendations
- Watchlists
- Historical performance

---

# 7. External Data Sources

## Cryptocurrency

CoinGecko API

---

## Stocks & ETFs

Finnhub API

---

# 8. Security

- HTTPS
- API validation
- Input sanitization
- Secure authentication (future)

---

# 9. Scalability

Future versions may introduce:

- Redis caching
- Background workers
- AI model optimization
- Multiple market providers

---

# 10. Deployment

Development:

- Local environment

Production:

- Vercel (Frontend)

- Railway or Render (Backend)

- Supabase (Database)

---

# Architecture Principles

- Modular
- Transparent
- Scalable
- Easy to maintain
