# Magic Link + Polymarket Trading Demo

## Overview

A Next.js app demonstrating how Polymarket users who logged in via Magic Link (email/Google OAuth) can trade on external apps by importing their private key.

Polymarket's Magic auth creates two wallets: a **Magic EOA** (for signing) and a **Proxy wallet** (contract that holds assets). This demo derives the proxy address, authenticates with Polymarket's CLOB, and enables gasless trading without Web3 extensions.

**Prerequisites**: Users must have logged in on Polymarket.com via Magic at least once (to deploy their proxy wallet). Not part of Polymarket's Builder Program.

---

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local`:

```bash
# Polygon RPC endpoint (required)
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
# Or use Alchemy/Infura:
# NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Get Your Magic Wallet Private Key

1. Sign into Polymarket.com with Magic email/Google option
1. Login at [reveal.magic.link/polymarket](https://reveal.magic.link/polymarket)
1. Copy your private key
1. Paste into the app

---

## Usage Flow

### 1. Authentication

- Enter Magic wallet private key
- App displays:
  - **EOA Wallet**: Your Magic signing wallet (don't fund)
  - **Proxy Wallet**: Your trading wallet (fund with USDC.e)

### 2. Initialize CLOB Client

- Click "Initialize CLOB Client"
- Signs EIP-712 message (one-time auth)
- Receives API credentials
- Client status: "Ready to Trade"

### 3. View Balance

- USDC.e balance displays automatically from proxy wallet

### 4. Trading

**Browse Markets**: Markets tab shows top 10 by 24h volume

**Place Orders**:

- Market order: Executes immediately at current price
- Limit order: Sets price (1-99 cents), waits for fill

**Manage Positions**: Positions tab shows all open positions with P&L and "Market Sell" button

**Monitor Orders**: Orders tab shows open limit orders with cancel functionality

---

## Key Polymarket Concepts

### 1. Two-Wallet Architecture

| Wallet Type      | Purpose                         | Funding             | Usage                                |
| ---------------- | ------------------------------- | ------------------- | ------------------------------------ |
| **Magic EOA**    | Signing authentication messages | ❌ Do NOT fund      | Signs EIP-712 messages for CLOB auth |
| **Proxy Wallet** | Holds assets, executes trades   | ✅ Fund with USDC.e | Stores USDC.e, outcome tokens        |

The Magic EOA creates API credentials via signature. The Proxy Wallet (deployed by Polymarket as an EIP-1167 minimal proxy) is **deterministically derived** from the EOA and holds all assets. All CLOB operations use the proxy as the "funder" address.

### 2. CLOB Authentication Flow

```
User Private Key (Magic EOA)
    ↓
Sign EIP-712 Message (L1 Auth)
    ↓
CLOB API
    ↓
Derive API Credentials (key, secret, passphrase)
    ↓
CLOB Client Initialized (L2 Auth)
    ↓
Trade without PK (uses HMAC signatures)
```

### 3. Outcome Tokens

Each market has 2+ outcomes (e.g., "Yes"/"No"). Each outcome is an ERC-1155 token:

```
Token ID: 0xabc...
  ├─ Represents "Yes" outcome
  ├─ Price: $0.72 (72% probability)
  └─ Redeemable for $1.00 if outcome occurs
```

---

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TailwindCSS 4
- **State Management**: TanStack React Query v5
- **Blockchain**:
  - `ethers` v5 - wallet creation and signing
  - `viem` v2 - Polygon RPC interactions
- **Polymarket**: [`@polymarket/clob-client`](https://github.com/Polymarket/clob-client) v4.22.8

---

## Polymarket SDK & API Integration

This section provides a breakdown of all Polymarket-related code.

---

### 1. CLOB Client Management

#### Location: `hooks/useClobClient.ts`

**Purpose**: Core hook for managing Polymarket CLOB client lifecycle, including authentication and credential management.

**Documentation**: [Polymarket CLOB Clients](https://docs.polymarket.com/developers/CLOB/clients) | [Authentication](https://docs.polymarket.com/developers/CLOB/authentication)

**Key Concepts**:

```typescript
const CLOB_API_URL = "https://clob.polymarket.com";
const POLYGON_CHAIN_ID = 137;
```

**Implementation**:

```typescript
// Step 1: Create temporary client and derive credentials
const tempClient = new ClobClient(CLOB_API_URL, POLYGON_CHAIN_ID, wallet);
const creds = await tempClient.createOrDeriveApiKey();

// Step 2: Create authenticated client with credentials
const client = new ClobClient(
  CLOB_API_URL,
  POLYGON_CHAIN_ID,
  wallet,
  creds,
  1, // signatureType: 1 for Magic Link users
  proxyAddress // funder address that holds assets
);
```

**Component Integration**: `components/ClobClientInitializer.tsx`

Provides UI for explaining the auth flow, triggering CLOB session creation, and displaying session status.

---

### 2. Proxy Wallet Derivation

#### Location: `hooks/useProxyWallet.ts`

**Purpose**: Deterministically compute the proxy wallet address from a Magic EOA address using CREATE2.

**Documentation**: [Polymarket Proxy Wallets](https://docs.polymarket.com/developers/proxy-wallet)

**Implementation** (CREATE2 formula):

```typescript
const salt = keccak256(eoaAddress);
const initCodeHash = keccak256(proxyBytecode);
const hash = keccak256(concat(["0xff", FACTORY, salt, initCodeHash]));
const proxyAddress = getAddress(`0x${hash.slice(26)}`); // last 20 bytes
```

**Constants**:

- Factory: `0xaB45c5A4B0c941a2F231C04C3f49182e1A254052`
- Implementation: `0x44e999d5c2F66Ef0861317f9A4805AC2e90aEB4f`

Users don't need to manually input their proxy address - the app calculates it automatically from their EOA.

---

### 3. Order Placement & Management

#### Location: `hooks/useClobOrder.ts`

**Purpose**: Handle all order operations (creation, submission, cancellation) through the CLOB.

**Documentation**: [Order Placement Guide](https://docs.polymarket.com/quickstart/orders/first-order) | [CLOB Client Methods](https://docs.polymarket.com/developers/CLOB/clients)

**Key Operations**:

##### Market Orders

**Method**: [`getPrice`](https://github.com/Polymarket/clob-client) - Fetches the current best price from the orderbook

```typescript
// Get current market price from orderbook
const priceFromOrderbook = await clobClient.getPrice(tokenId, side);
const marketPrice = parseFloat(priceFromOrderbook.price);

// Apply aggressive pricing to ensure fills
if (side === "BUY") {
  aggressivePrice = Math.min(0.99, marketPrice * 1.05); // +5% above market
} else {
  aggressivePrice = Math.max(0.01, marketPrice * 0.95); // -5% below market
}
```

**Why Aggressive Pricing?**

Polymarket's CLOB doesn't have true "market orders". To simulate market execution, we submit limit orders at aggressive prices that are likely to fill immediately:

- **Buy orders**: 5% above current market price (capped at $0.99)
- **Sell orders**: 5% below current market price (floored at $0.01)

If `getPrice()` fails (illiquid market, API error), falls back to Buy: $0.99, Sell: $0.01.

##### Limit Orders

**Method**: [`createAndPostOrder`](https://docs.polymarket.com/quickstart/orders/first-order) - Creates and submits order to CLOB

```typescript
const limitOrder: UserOrder = {
  tokenID: params.tokenId, // Outcome token address
  price: params.price, // User-specified price (0.01 to 0.99)
  size: params.size, // Number of shares
  side: Side.BUY | Side.SELL,
  feeRateBps: 0, // Maker/taker fees (usually 0)
  expiration: 0, // 0 = Good-til-Cancel (GTC)
  taker: "0x0000...", // Open order (any taker)
};

await clobClient.createAndPostOrder(
  limitOrder,
  { negRisk: params.negRisk }, // Special market type flag
  OrderType.GTC
);
```

**Neg Risk**: Negative risk markets belong to events where only one market can resolve as "Yes" (mutually exclusive outcomes, e.g., "Who will win the election?"). The `negRisk` flag enables capital-efficient order matching where "No" shares in one market can be converted to "Yes" shares in all other markets in the same event.

##### Order Cancellation

**Method**: [`cancelOrder`](https://github.com/Polymarket/clob-client) - Cancels an existing order by ID

```typescript
await clobClient.cancelOrder({ orderID: orderId });
```

**Component Integration**:

- `components/OrderPlacementModal.tsx` - UI for creating orders
- `components/UserPositions.tsx` - Market sell functionality
- `components/ActiveOrders.tsx` - Order cancellation

---

### 4. Market Data Fetching

#### Location: `app/api/polymarket/markets/route.ts`

**Purpose**: Server-side API route to fetch high-volume markets from Polymarket's Gamma API.

**API Endpoint**: `https://gamma-api.polymarket.com/markets`

**Documentation**: [Gamma Markets API](https://docs.polymarket.com/api-reference/markets/list-markets) - Public market discovery endpoint

**Query Parameters**:

- `limit`: Number of markets to fetch
- `active=true`, `closed=false`: Only active, open markets
- `order=volume24hr`, `ascending=false`: Sort by 24h volume descending

**Why Server-Side?**

1. **Next.js ISR Caching**: `next: { revalidate: 60 }` provides automatic caching and revalidation
2. **Consistent API patterns**: Keeps all API calls server-side for easier maintenance
3. **Future flexibility**: Allows adding rate limiting, logging, or transformations if needed

**Data Structure**:

```typescript
{
  id: string;
  question: string; // "Will Bitcoin hit $100k by 2025?"
  outcomes: string; // JSON: ["Yes", "No"]
  outcomePrices: string; // JSON: ["0.72", "0.28"]
  clobTokenIds: string; // JSON: ["0xabc...", "0xdef..."]
  volume24hr: number; // 24h trading volume in USD
  liquidity: number; // Available liquidity
  closed: boolean;
  negRisk: boolean;
}
```

**Consumer**: `hooks/useHighVolumeMarkets.ts` → `components/HighVolumeMarkets.tsx`

---

### 5. User Positions Tracking

#### Location: `app/api/polymarket/positions/route.ts`

**Purpose**: Fetch user's current positions from Polymarket's Data API.

**API Endpoint**: `https://data-api.polymarket.com/positions`

**Documentation**: [Data API - Positions](https://docs.polymarket.com/api-reference/core/get-current-positions-for-a-user)

**Query Parameters**:

- `user`: Proxy wallet address
- `sizeThreshold`: Minimum position size (0.01 to filter dust)
- `limit`: Max positions to return (500)

**Data Structure**:

```typescript
{
  asset: string; // Token ID
  conditionId: string; // Market condition ID
  size: number; // Number of shares held
  avgPrice: number; // Average purchase price
  currentValue: number; // Current market value
  cashPnl: number; // Profit/Loss in USD
  percentPnl: number; // P&L percentage
  curPrice: number; // Current market price
  redeemable: boolean; // Market resolved?
  title: string; // Market question
  outcome: string; // Outcome name ("Yes"/"No")
  negativeRisk: boolean;
}
```

**Consumer**: `hooks/useUserPositions.ts` → `components/UserPositions.tsx`

The component displays position cards with market info, P&L, and "Market Sell" functionality.

---

### 6. Active Orders Monitoring

#### Location: `hooks/useActiveOrders.ts`

**Purpose**: Fetch user's open limit orders directly from CLOB client.

**Method**: [`getOpenOrders`](https://github.com/Polymarket/clob-client) - Retrieves all active orders for the user

```typescript
const allOrders = await clobClient.getOpenOrders();
```

**Why Not an API Route?**

The CLOB client's `getOpenOrders()` method requires authenticated credentials. We use the client-side `clobClient` instance that already has the user's API credentials.

**Filtering Logic**:

```typescript
// Filter by user's wallet address and "LIVE" status
const userOrders = allOrders.filter((order) => {
  return order.maker_address.toLowerCase() === walletAddress.toLowerCase();
});
const activeOrders = userOrders.filter((order) => order.status === "LIVE");
```

**Order Data**:

```typescript
{
  id: string;                 // Order ID (for cancellation)
  asset_id: string;           // Token ID
  side: "BUY" | "SELL";
  original_size: string;      // Total shares
  price: string;              // Limit price
  created_at: number;         // Unix timestamp
  status: "LIVE" | ...;
}
```

**Consumer**: `components/ActiveOrders.tsx`

---

#### Location: `app/api/polymarket/market-by-token/route.ts`

**Purpose**: Server-side API route to enrich order data with market metadata by looking up markets via token ID.

**API Endpoint**: `https://gamma-api.polymarket.com/markets`

**Documentation**: [Gamma Markets API](https://docs.polymarket.com/api-reference/markets/list-markets) - Public market discovery endpoint

**Query Strategy**:

Fetches up to 100 active markets, then filters by `clobTokenIds` to find which market contains the requested token ID.

**Query Parameters** (to Gamma API):

- `limit=100`: Fetch top 100 active markets
- `active=true`, `closed=false`: Only active, open markets
- Server-side caching: `next: { revalidate: 300 }` (5 minutes)

**Why Server-Side?**

1. **Consistent API patterns**: Matches other Polymarket API routes structure
2. **Next.js ISR Caching**: Automatic caching and revalidation
3. **Uses public Gamma API**: No undocumented endpoints

**Lookup Logic**:

```typescript
// Find market containing this token ID
const market = markets.find((m) => {
  if (!m.clobTokenIds) return false;
  const tokenIds = JSON.parse(m.clobTokenIds);
  return tokenIds.includes(requestedTokenId);
});
```

**Data Structure** (returns full market object):

```typescript
{
  id: string;
  question: string; // "Will Bitcoin hit $100k by 2025?"
  outcomes: string; // JSON: ["Yes", "No"]
  outcomePrices: string; // JSON: ["0.72", "0.28"]
  clobTokenIds: string; // JSON: ["0xabc...", "0xdef..."]
  volume24hr: number;
  liquidity: number;
  closed: boolean;
  negRisk: boolean;
}
```

**Consumer**: `components/ActiveOrders.tsx` - Displays market question and matches token ID to correct outcome name

**Implementation Detail**: The component matches the order's `asset_id` to the index in `clobTokenIds` array to display the correct outcome ("Yes" vs "No")

---

### 7. Polygon Asset Balances

#### Location: `hooks/usePolygonBalances.ts`

**Purpose**: Fetch USDC.e balance from the proxy wallet using direct Polygon RPC calls.

**Why Not Polymarket API?**

Balance checking is a standard ERC-20 operation. We use `viem` for direct RPC calls to avoid unnecessary API dependencies.

**Contract**: [`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`](https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174) (USDC.e)

**Method**:

```typescript
const balance = await publicClient.readContract({
  address: USDCE_ADDRESS,
  abi: ERC20_ABI,
  functionName: "balanceOf",
  args: [proxyAddress],
});

const formattedBalance = formatUnits(balance, 6); // USDC.e has 6 decimals
```

**Consumer**: `components/PolygonAssets.tsx`

---

## Project Structure

```
magic-pk/
├── app/
│   ├── api/
│   │   └── polymarket/
│   │       ├── market-by-token/route.ts # Gamma API lookup (market by token ID)
│   │       ├── markets/route.ts         # Gamma API proxy (high-volume markets)
│   │       └── positions/route.ts       # Data API proxy (user positions)
│   ├── layout.tsx                      # React Query provider wrapper
│   ├── page.tsx                        # Main app page
│   └── globals.css
│
├── components/
│   ├── ActiveOrders.tsx                # Display and cancel open limit orders
│   ├── ClobClientInitializer.tsx       # CLOB authentication UI
│   ├── Header.tsx                      # PK input, wallet display
│   ├── HighVolumeMarkets.tsx           # Browse top markets by volume
│   ├── MarketTabs.tsx                  # Tab navigation (Markets/Positions/Orders)
│   ├── OrderPlacementModal.tsx         # Buy order modal (market/limit)
│   ├── PolygonAssets.tsx               # USDC.e balance display
│   └── Portal.tsx                      # Modal portal utility
│
├── hooks/
│   ├── useActiveOrders.ts              # Fetch open orders via CLOB
│   ├── useAddressCopy.ts               # Clipboard copy utility
│   ├── useClobClient.ts                # CLOB client lifecycle management
│   ├── useClobOrder.ts                 # Order submission/cancellation
│   ├── useHighVolumeMarkets.ts         # Fetch markets from Gamma API
│   ├── usePolygonBalances.ts           # Fetch USDC.e balance via RPC
│   ├── useProxyWallet.ts               # Derive proxy address from EOA
│   ├── useUserPositions.ts             # Fetch positions from Data API
│   └── useWalletFromPK.ts              # Create ethers Wallet from PK
│
├── providers/
│   └── QueryProvider.tsx               # TanStack Query client setup
│
├── package.json
└── README.md
```

---

## API Reference

### Polymarket APIs Used

| API           | Base URL                           | Purpose                         | Auth          |
| ------------- | ---------------------------------- | ------------------------------- | ------------- |
| **Gamma API** | `https://gamma-api.polymarket.com` | Market data, metadata           | Public        |
| **Data API**  | `https://data-api.polymarket.com`  | User positions, historical data | Public        |
| **CLOB API**  | `https://clob.polymarket.com`      | Order submission, cancellation  | Authenticated |

### Key SDK Methods

**Documentation**: [CLOB Client Reference](https://github.com/Polymarket/clob-client) | [Developer Quickstart](https://docs.polymarket.com/quickstart)

```typescript
// Create CLOB client
const client = new ClobClient(host, chainId, wallet, creds?, sigType?, proxyAddr?);

// Get or create API credentials
const creds = await client.createOrDeriveApiKey();

// Get market price from orderbook
const price = await client.getPrice(tokenId, side);

// Submit order
const response = await client.createAndPostOrder(order, options, orderType);

// Cancel order
await client.cancelOrder({ orderID });

// Get open orders
const orders = await client.getOpenOrders();
```

---

## Security Considerations

### ⚠️ Private Key Handling

**This demo uses client-side private key input for simplicity. This is NOT production-ready.**

---

## Known Limitations

1. **No Market Order Guarantee**: Aggressive limit orders can fail to fill in illiquid markets
2. **No Order Status Tracking**: App doesn't show partial fills or order history
3. **No Redemption Flow**: Cannot redeem winning positions (must do on Polymarket.com)
4. **No Multi-Outcome Support**: UI optimized for binary (Yes/No) markets
5. **No Slippage Protection**: Market orders don't have configurable slippage limits

---

## Dependencies

| Package                                                                | Version  | Purpose                                                                          |
| ---------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| [`@polymarket/clob-client`](https://github.com/Polymarket/clob-client) | ^4.22.8  | **Official Polymarket SDK** - order management, authentication, orderbook access |
| `@tanstack/react-query`                                                | ^5.90.10 | Server state management - polling, caching, refetching                           |
| `ethers`                                                               | ^5.8.0   | Wallet creation, signing, EIP-712 messages                                       |
| `viem`                                                                 | ^2.39.2  | Modern Ethereum library - RPC calls, address utilities, keccak256                |
| `next`                                                                 | 16.0.3   | React framework with App Router, API routes, ISR                                 |
| `react` / `react-dom`                                                  | 19.2.0   | UI rendering                                                                     |

---

## Troubleshooting

### "CLOB client not initialized"

- Click "Initialize CLOB Client" button
- Ensure private key is valid
- Check browser console for errors

### "Invalid private key"

- Key must start with `0x`
- Key must be 66 characters (0x + 64 hex chars)
- Get fresh key from [reveal.magic.link/polymarket](https://reveal.magic.link/polymarket)

### Orders not appearing

- Wait 2-3 seconds for updates
- Check USDC.e balance (need funds to trade)
- Verify order was submitted (check browser console)

### Balance shows $0.00

- Ensure you funded the **Proxy Wallet**, not the EOA
- Check [Polygonscan](https://polygonscan.com) for confirmation
- RPC endpoint must be working (check env var)

---

## Useful Resources

### Polymarket Documentation

- [CLOB Clients](https://docs.polymarket.com/developers/CLOB/clients) - Client initialization and methods
- [Authentication](https://docs.polymarket.com/developers/CLOB/authentication) - API key derivation and auth flow
- [Order Placement Guide](https://docs.polymarket.com/quickstart/orders/first-order) - Step-by-step order tutorial
- [Developer Quickstart](https://docs.polymarket.com/quickstart) - Getting started guide
- [CLOB Client GitHub](https://github.com/Polymarket/clob-client) - Official TypeScript SDK

### Other Resources

- [Magic Link Docs](https://magic.link/docs) - Magic authentication documentation
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712) - Typed structured data hashing
- [EIP-1167 Minimal Proxy](https://eips.ethereum.org/EIPS/eip-1167) - Minimal proxy contract standard

---

## Support

Questions or issues? Reach out on Telegram: **[@notyrjo](https://t.me/notyrjo)**

---

## License

MIT

---

**Built with ❤️ for the Polymarket community**
