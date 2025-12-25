# Polymarket Magic Link Integration Demo

A Next.js application demonstrating how to integrate Polymarket trading for users who've previously logged into and traded on Polymarket.com via **Magic Link (email/Google OAuth)**.

Non-Safe Proxy Wallets are deployed for Magic users on `Polymarket.com`. If your goal is to enable these traders to manage the same account on both apps, you will need to interact with this custom proxy wallet that's only used for Magic users.

## Key Features

- **Server-side private key handling** — Private key stored securely in `.env.local`
- **Deterministic proxy wallet derivation** — Non-Safe Proxy Wallet address derived via CREATE2
- **Server-side order signing** — All trading operations happen through API routes
- **Market & limit orders** — Market orders (FOK) and limit orders (GTC) with dynamic tick sizes
- **Position & order management** — View positions, active orders, and cancel orders
- **Gasless transactions** — Token approvals, transfers, and redemptions via Builder Relayer

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Architecture Overview](#architecture-overview)
4. [API Routes](#api-routes)
5. [Key Implementation Details](#key-implementation-details)
6. [Project Structure](#project-structure)
7. [Environment Variables](#environment-variables)
8. [Key Dependencies](#key-dependencies)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before running this demo, you need:

1. **Magic Link Account on Polymarket**
   - Visit `polymarket.com` and sign up via Magic Link (email/Google)
   - Complete at least one trade to deploy your proxy wallet and set token approvals

2. **Magic Wallet Private Key**
   - Visit [reveal.magic.link/polymarket](https://reveal.magic.link/polymarket) after creating the account on `polymarket.com` and conducting one trade
   - Get your private key

3. **Polygon RPC URL**
   - Any Polygon mainnet RPC (Alchemy, Infura, or public RPC)
   - Defaults to a public RPC URL

4. **USDC.e Funds**
   - Send USDC.e to the **Non-Safe Proxy Wallet** (not EOA) for trading
   - If unsure of your Non-Safe Proxy Wallet address, get it from either the listed address on `polymarket.com` after logging in, or simply start this demo

---

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local`:

```bash
# Required: Your Magic wallet private key (obtained from reveal.magic.link/polymarket)
POLYMARKET_MAGIC_PK=0x...your_private_key_here

# Optional: Custom Polygon RPC endpoint
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture Overview

This demo uses a **server-side architecture** where the private key never leaves the server:

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Client)                                               │
├─────────────────────────────────────────────────────────────────┤
│  • React UI components                                          │
│  • TradingSession context (stores API credentials in memory)    │
│  • Calls API routes for all wallet/trading operations           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP Requests
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API Routes (Server)                                    │
├─────────────────────────────────────────────────────────────────┤
│  • Private key loaded from .env.local                           │
│  • Proxy wallet derivation                                      │
│  • API credential generation                                    │
│  • Order signing & submission                                   │
│  • Relay transactions (approvals, transfers, redemptions)       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Polymarket APIs                                                │
├─────────────────────────────────────────────────────────────────┤
│  • CLOB API (clob.polymarket.com) — Orders, prices, tick sizes  │
│  • Data API (data-api.polymarket.com) — Positions               │
│  • Gamma API (gamma-api.polymarket.com) — Market data           │
│  • Builder Relayer — Gasless transactions                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Routes

### Wallet Operations

| Route | Method | Description |
|-------|--------|-------------|
| `/api/wallet` | GET | Returns EOA and derived proxy wallet addresses |
| `/api/wallet/credentials` | POST | Creates or derives User API credentials |
| `/api/wallet/relay` | POST | Executes gasless relay transactions (approvals, transfers, redemptions) |

### Order Management

| Route | Method | Description |
|-------|--------|-------------|
| `/api/orders` | POST | Creates and submits market/limit orders |
| `/api/orders` | DELETE | Cancels an active order |
| `/api/orders/active` | GET | Fetches all active orders for the wallet |

### Market Data

| Route | Method | Description |
|-------|--------|-------------|
| `/api/polymarket/markets` | GET | Fetches high-volume markets from Gamma API |
| `/api/polymarket/market-by-token` | GET | Fetches market details by token ID |
| `/api/polymarket/positions` | GET | Fetches user positions from Data API |
| `/api/polymarket/prices` | POST | Batch fetches real-time bid/ask prices |
| `/api/polymarket/tick-size` | GET | Fetches minimum tick size for a token |
| `/api/polymarket/sign` | POST | Signs messages for Builder authentication |

---

## Key Implementation Details

### 1. Server-Side Wallet Management

**File**: `app/api/wallet/route.ts`

The private key is loaded from environment variables and never exposed to the client:

```typescript
import { Wallet, providers } from "ethers";
import { deriveProxyAddress } from "@/utils/proxyWallet";

const privateKey = process.env.POLYMARKET_MAGIC_PK;
const provider = new providers.JsonRpcProvider(POLYGON_RPC_URL);
const wallet = new Wallet(privateKey, provider);
const proxyAddress = deriveProxyAddress(wallet.address);
```

### 2. Proxy Wallet Derivation

**File**: `utils/proxyWallet.ts`

Polymarket's Magic auth creates a **Non-Safe Proxy Wallet** (EIP-1167 minimal proxy) that is deterministically derived from the user's EOA using CREATE2:

```typescript
import { keccak256, getCreate2Address, encodePacked } from "viem";
import { PROXY_FACTORY, PROXY_INIT_CODE_HASH } from "@/constants/proxyWallet";

export function deriveProxyAddress(eoaAddress: string): string {
  return getCreate2Address({
    bytecodeHash: PROXY_INIT_CODE_HASH,
    from: PROXY_FACTORY,
    salt: keccak256(encodePacked(["address"], [eoaAddress])),
  });
}
```

**Key Points:**
- Proxy address is **deterministic** — same EOA always gets same proxy address
- Proxy is the "funder" address that holds USDC.e and outcome tokens
- User must fund the **Proxy Wallet**, not the EOA

### 3. Order Placement

**File**: `app/api/orders/route.ts`

Orders are signed and submitted server-side:

#### Market Orders (Fill or Kill)

```typescript
import { ClobClient, Side, OrderType } from "@polymarket/clob-client";

const marketOrder: UserMarketOrder = {
  tokenID: tokenId,
  amount: dollarAmount,  // For BUY: size * askPrice
  side: Side.BUY,
  feeRateBps: 0,
};

await clobClient.createAndPostMarketOrder(
  marketOrder,
  { negRisk: false },
  OrderType.FOK  // Fill or Kill — immediate execution or cancel
);
```

#### Limit Orders (Good Till Cancelled)

```typescript
const limitOrder: UserOrder = {
  tokenID: tokenId,
  price: 0.55,  // Must be multiple of tick size
  size: shares,
  side: Side.BUY,
  feeRateBps: 0,
  expiration: 0,
  taker: "0x0000000000000000000000000000000000000000",
};

await clobClient.createAndPostOrder(
  limitOrder,
  { negRisk: false },
  OrderType.GTC  // Good Till Cancelled
);
```

### 4. Dynamic Tick Sizes

**File**: `app/api/polymarket/tick-size/route.ts`

Different markets have different minimum tick sizes (0.1, 0.01, 0.001, 0.0001). The order modal fetches the tick size and:
- Validates price is within valid range
- Ensures price is a multiple of tick size
- Constrains input decimal places accordingly

```typescript
const tickSize = await clobClient.getTickSize(tokenId);
// Returns: 0.01, 0.001, 0.0001, etc.
```

### 5. Gasless Relay Transactions

**File**: `app/api/wallet/relay/route.ts`

Token approvals, USDC transfers, and position redemptions use the Builder Relayer for gasless execution:

```typescript
import { RelayClient, RelayerTxType, CallType, encodeProxyTransactionData } from "@polymarket/builder-relayer-client";
import { buildProxyTransactionRequest, calculateGasLimit } from "@/utils/relay";

// Get relay payload (nonce + relay address) from relayer
const relayPayload = await relayClient.getRelayPayload(from, "PROXY");

// Encode transactions (e.g., ERC20 transfer)
const proxyTxns = transactions.map(txn => ({
  to: txn.to,
  typeCode: CallType.Call,
  data: txn.data,
  value: "0",
}));

// Build signed transaction with dynamic gas limit
const txRequest = await buildProxyTransactionRequest(signer, {
  from,
  data: encodeProxyTransactionData(proxyTxns),
  gasLimit: calculateGasLimit(transactions.length),
  relay: relayPayload.address,
  nonce: relayPayload.nonce,
});

// Submit to relayer
await fetch(`${RELAYER_URL}submit`, { method: "POST", body: JSON.stringify(txRequest) });
```

---

## Project Structure

```
magic-pk/
├── app/
│   ├── api/
│   │   ├── orders/
│   │   │   ├── route.ts              # Create/cancel orders
│   │   │   └── active/
│   │   │       └── route.ts          # Fetch active orders
│   │   ├── polymarket/
│   │   │   ├── market-by-token/
│   │   │   │   └── route.ts          # Market lookup by token
│   │   │   ├── markets/
│   │   │   │   └── route.ts          # High-volume markets
│   │   │   ├── positions/
│   │   │   │   └── route.ts          # User positions
│   │   │   ├── prices/
│   │   │   │   └── route.ts          # Batch price fetching
│   │   │   ├── sign/
│   │   │   │   └── route.ts          # Builder authentication
│   │   │   └── tick-size/
│   │   │       └── route.ts          # Market tick sizes
│   │   └── wallet/
│   │       ├── route.ts              # EOA/proxy addresses
│   │       ├── credentials/
│   │       │   └── route.ts          # API credentials
│   │       └── relay/
│   │           └── route.ts          # Gasless transactions
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── Header.tsx                    # Wallet address display
│   ├── PolygonAssets/
│   │   ├── index.tsx                 # Balance display
│   │   └── TransferModal.tsx         # USDC transfer UI
│   ├── Trading/
│   │   ├── MarketTabs.tsx            # Tab navigation
│   │   ├── Markets/
│   │   │   └── index.tsx             # Market browser
│   │   ├── OrderModal/
│   │   │   ├── index.tsx             # Order placement UI
│   │   │   ├── OrderForm.tsx         # Size/price inputs
│   │   │   ├── OrderSummary.tsx      # Cost calculation
│   │   │   └── OrderTypeToggle.tsx   # Market/limit toggle
│   │   ├── Orders/
│   │   │   └── index.tsx             # Active orders list
│   │   └── Positions/
│   │       └── index.tsx             # Position cards
│   └── TradingSession/
│       └── index.tsx                 # Session initialization UI
│
├── hooks/
│   ├── useActiveOrders.ts            # Fetch/cancel orders via API
│   ├── useAddressCopy.ts             # Copy address to clipboard
│   ├── useClobOrder.ts               # Submit orders via API
│   ├── useGeoblock.ts                # Geo-restriction detection
│   ├── useMarkets.ts                 # Fetch markets from Gamma API
│   ├── usePolygonBalances.ts         # Check USDC.e balance
│   ├── useRedeemPosition.ts          # Redeem via API
│   ├── useTokenApprovals.ts          # Approve via API
│   ├── useTradingSession.ts          # Session management
│   ├── useUsdcTransfer.ts            # Transfer via API
│   ├── useUserApiCredentials.ts      # API credentials management
│   └── useUserPositions.ts           # Fetch positions
│
├── providers/
│   ├── QueryProvider.tsx             # TanStack Query setup
│   ├── TradingProvider.tsx           # Trading session context
│   └── WalletProvider.tsx            # Wallet addresses context
│
├── utils/
│   ├── approvals.ts                  # Token approval logic
│   ├── classNames.ts                 # CSS class utilities
│   ├── formatting.ts                 # Number/address formatting
│   ├── order.ts                      # Order helpers
│   ├── polling.ts                    # Async polling utilities
│   ├── proxyWallet.ts                # CREATE2 proxy derivation
│   ├── redeem.ts                     # Position redemption logic
│   ├── relay.ts                      # Relay transaction building
│   ├── session.ts                    # TradingSession type
│   ├── transfers.ts                  # USDC transfer utilities
│   └── validation.ts                 # Input validation
│
└── constants/
    ├── api.ts                        # API endpoint URLs
    ├── categories.ts                 # Market categories
    ├── polymarket.ts                 # API URLs, chain ID
    ├── proxyWallet.ts                # Proxy contract addresses
    ├── query.ts                      # React Query keys
    ├── tokens.ts                     # Token addresses
    ├── ui.ts                         # UI constants
    └── validation.ts                 # Validation constants
```

---

## Environment Variables

Create `.env.local`:

```bash
# Required: Your Magic wallet private key
POLYMARKET_MAGIC_PK=0x...your_64_character_hex_private_key

# Optional: Custom Polygon RPC endpoint (defaults to public RPC)
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
```

**⚠️ Security Notes:**
- Never commit `.env.local` to version control
- The private key is only accessible server-side
- In production, use proper secrets management (Vault, AWS Secrets Manager, etc.)

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| [`@polymarket/clob-client`](https://github.com/Polymarket/clob-client) | ^4.22.8 | Order placement, API credentials, prices |
| [`@polymarket/builder-relayer-client`](https://github.com/Polymarket/builder-relayer-client) | ^0.0.8 | Gasless relay transactions |
| [`@polymarket/builder-signing-sdk`](https://github.com/Polymarket/builder-signing-sdk) | ^0.0.8 | Builder authentication |
| [`@tanstack/react-query`](https://tanstack.com/query) | ^5.90.10 | Server state management |
| [`ethers`](https://docs.ethers.org/v5/) | ^5.8.0 | Wallet creation, signing |
| [`viem`](https://viem.sh/) | ^2.39.2 | Address derivation, hashing |
| [`next`](https://nextjs.org/) | ^16.0.10 | React framework, API routes |

---

## Troubleshooting

### "Wallet not configured"
- Ensure `POLYMARKET_MAGIC_PK` is set in `.env.local`
- Private key must start with `0x` and be 66 characters total

### Balance shows $0.00
- Ensure you funded the **Proxy Wallet**, not the EOA
- Check [Polygonscan](https://polygonscan.com) for confirmation
- The app displays the proxy wallet address — send USDC.e there

### "Order submission failed"
- Check USDC.e balance in proxy wallet
- Ensure trading session is initialized (click "Initialize" button)
- For limit orders, ensure price is a valid multiple of tick size

### Market orders sitting as limit orders
- Market orders use FOK (Fill or Kill) — they should execute immediately or fail
- If liquidity is low, the order may fail instead of partially filling

### "Proxy wallet not deployed"
- Must log in to `polymarket.com` at least once via Magic Link
- Complete at least one trade to deploy the proxy and set approvals
- Proxy deployment happens on Polymarket, not in this app

### Price/tick size validation errors
- Each market has a different tick size (0.01, 0.001, etc.)
- The order modal shows the allowed tick size and valid range
- Prices must be exact multiples of the tick size

---

## Resources

### Polymarket Documentation
- [CLOB Client Docs](https://docs.polymarket.com/developers/CLOB/clients)
- [Authentication](https://docs.polymarket.com/developers/CLOB/authentication)
- [Order Placement](https://docs.polymarket.com/quickstart/orders/first-order)
- [Proxy Wallets](https://docs.polymarket.com/developers/proxy-wallet)

### GitHub Repositories
- [clob-client](https://github.com/Polymarket/clob-client)
- [builder-relayer-client](https://github.com/Polymarket/builder-relayer-client)

### Other Resources
- [Magic Link Documentation](https://magic.link/docs)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-1167 Minimal Proxy](https://eips.ethereum.org/EIPS/eip-1167)

---

## Support

Questions or issues? Reach out on Telegram: **[@notyrjo](https://t.me/notyrjo)**

---

## License

MIT

---

**Built for developers exploring the Polymarket ecosystem**
