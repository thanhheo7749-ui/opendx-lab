// ==============================================================================
// BizScan — Market Intelligence Agent
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Crawls market trends from Google Trends + SerpApi, compares with shop products.
// ==============================================================================

import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MarketComparison {
  productName: string;
  productSku: string;
  yourPrice: number;
  marketAvgPrice: number | null;
  priceDiff: string | null; // "+18% (đắt hơn thị trường)"
  trendScore: number; // 0-100
  trendChange: string | null; // "+120% search volume"
  competitorCount: number | null;
  recommendation: string;
  category: "HOT" | "DECLINING" | "STABLE" | "NEW";
}

export interface MarketTrendData {
  keyword: string;
  source: string;
  trendScore: number;
  changePercent: number | null;
  avgPrice: number | null;
  competitorCount: number | null;
  rawData: Record<string, unknown>;
}

// ── SerpApi Integration ────────────────────────────────────────────────────────

async function fetchSerpApiTrends(keyword: string): Promise<MarketTrendData | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey || apiKey === "YOUR_SERPAPI_KEY_HERE") {
    console.log(`[MarketIntel] SerpApi key not set, skipping: "${keyword}"`);
    return null;
  }

  try {
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: keyword,
      gl: "vn",
      hl: "vi",
      api_key: apiKey,
    });

    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      console.error(`[MarketIntel] SerpApi error for "${keyword}": ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = data.shopping_results ?? [];

    // Calculate avg price from results
    const prices = results
      .map((r: { extracted_price?: number }) => r.extracted_price)
      .filter((p: number | undefined): p is number => typeof p === "number" && p > 0);

    const avgPrice =
      prices.length > 0 ? Math.round(prices.reduce((s: number, p: number) => s + p, 0) / prices.length) : null;

    return {
      keyword,
      source: "serpapi",
      trendScore: Math.min(100, Math.round((results.length / 50) * 100)),
      changePercent: null, // SerpApi doesn't provide this directly
      avgPrice,
      competitorCount: results.length,
      rawData: {
        total_results: data.search_information?.total_results,
        results_count: results.length,
        sample_prices: prices.slice(0, 5),
      },
    };
  } catch (error) {
    console.error(`[MarketIntel] SerpApi fetch failed for "${keyword}":`, error);
    return null;
  }
}

// ── Google Trends (lightweight, no API key needed) ─────────────────────────────

async function fetchGoogleTrends(keyword: string): Promise<MarketTrendData | null> {
  try {
    // Use Google Trends explore endpoint (public, no key needed)
    // Note: This is a simplified approach. For production, use google-trends-api npm package.
    const params = new URLSearchParams({
      engine: "google_trends",
      q: keyword,
      geo: "VN",
      date: "today 3-m", // Last 3 months
      api_key: process.env.SERPAPI_KEY ?? "",
    });

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey || apiKey === "YOUR_SERPAPI_KEY_HERE") {
      return null;
    }

    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const timelineData = data.interest_over_time?.timeline_data ?? [];

    if (timelineData.length === 0) return null;

    // Calculate trend score from latest data points
    const recentValues = timelineData
      .slice(-4) // Last 4 data points
      .map((d: { values?: { extracted_value?: number }[] }) => d.values?.[0]?.extracted_value ?? 0);

    const olderValues = timelineData
      .slice(0, 4) // First 4 data points
      .map((d: { values?: { extracted_value?: number }[] }) => d.values?.[0]?.extracted_value ?? 0);

    const recentAvg =
      recentValues.length > 0 ? recentValues.reduce((s: number, v: number) => s + v, 0) / recentValues.length : 0;

    const olderAvg =
      olderValues.length > 0 ? olderValues.reduce((s: number, v: number) => s + v, 0) / olderValues.length : 0;

    const changePercent =
      olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

    return {
      keyword,
      source: "google_trends",
      trendScore: Math.round(recentAvg),
      changePercent,
      avgPrice: null,
      competitorCount: null,
      rawData: {
        timeline_length: timelineData.length,
        recent_avg: recentAvg,
        older_avg: olderAvg,
      },
    };
  } catch (error) {
    console.error(`[MarketIntel] Google Trends failed for "${keyword}":`, error);
    return null;
  }
}

// ── Core Logic ─────────────────────────────────────────────────────────────────

/**
 * Extract unique keywords from shop's product catalog for market research.
 */
async function getProductKeywords(): Promise<string[]> {
  const products = await prisma.sbProduct.findMany({
    where: { isActive: true },
    select: { name: true, category: true },
  });

  // Extract meaningful keywords from product names + categories
  const keywords = new Set<string>();
  const categories = new Set<string>();

  for (const p of products) {
    categories.add(p.category.toLowerCase());
    // Extract key terms from product names
    const terms = p.name.toLowerCase().split(/\s+/);
    if (terms.length >= 2) {
      // Use 2-word combinations for better search
      keywords.add(terms.slice(0, 3).join(" "));
    }
  }

  // Also add category-level keywords
  for (const cat of categories) {
    keywords.add(cat);
  }

  return Array.from(keywords).slice(0, 15); // Limit to conserve API calls
}

/**
 * Fetch market trends for all product keywords.
 */
export async function fetchMarketTrends(): Promise<MarketTrendData[]> {
  const keywords = await getProductKeywords();
  console.log(`[MarketIntel] Fetching trends for ${keywords.length} keywords...`);

  const trends: MarketTrendData[] = [];

  for (const keyword of keywords) {
    // Try SerpApi first (Google Shopping — has prices)
    const serpResult = await fetchSerpApiTrends(keyword);
    if (serpResult) {
      trends.push(serpResult);
      continue;
    }

    // Fallback: Google Trends via SerpApi
    const googleResult = await fetchGoogleTrends(keyword);
    if (googleResult) {
      trends.push(googleResult);
      continue;
    }

    console.log(`[MarketIntel] No data for "${keyword}", skipping`);
  }

  // Save trends to database
  if (trends.length > 0) {
    await prisma.sbMarketTrend.createMany({
      data: trends.map((t) => ({
        keyword: t.keyword,
        source: t.source,
        searchVolume: null,
        trendScore: t.trendScore,
        changePercent: t.changePercent,
        avgPrice: t.avgPrice,
        competitorCount: t.competitorCount,
        snapshot: t.rawData as object,
      })),
    });
    console.log(`[MarketIntel] Saved ${trends.length} trends to database`);
  }

  return trends;
}

/**
 * Compare shop products against market trends.
 */
export async function compareWithMarket(): Promise<MarketComparison[]> {
  // Get latest market trends
  const trends = await prisma.sbMarketTrend.findMany({
    orderBy: { fetchedAt: "desc" },
    distinct: ["keyword"],
    take: 20,
  });

  // Get shop products with inventory
  const products = await prisma.sbProduct.findMany({
    where: { isActive: true },
    include: { inventory: true },
  });

  const comparisons: MarketComparison[] = [];

  for (const product of products) {
    // Find matching trend (fuzzy match: check if any trend keyword is in product name)
    const matchingTrend = trends.find((t) =>
      product.name.toLowerCase().includes(t.keyword.toLowerCase()) ||
      t.keyword.toLowerCase().includes(product.category.toLowerCase())
    );

    if (!matchingTrend) continue;

    // Calculate price difference
    let priceDiff: string | null = null;
    if (matchingTrend.avgPrice && matchingTrend.avgPrice > 0) {
      const diffPct = Math.round(
        ((product.sellPrice - matchingTrend.avgPrice) / matchingTrend.avgPrice) * 100
      );
      if (diffPct > 5) {
        priceDiff = `+${diffPct}% (đắt hơn thị trường)`;
      } else if (diffPct < -5) {
        priceDiff = `${diffPct}% (rẻ hơn thị trường)`;
      } else {
        priceDiff = "Ngang giá thị trường";
      }
    }

    // Determine category
    let category: MarketComparison["category"] = "STABLE";
    if (matchingTrend.trendScore >= 70 && (matchingTrend.changePercent ?? 0) > 20) {
      category = "HOT";
    } else if ((matchingTrend.changePercent ?? 0) < -15) {
      category = "DECLINING";
    } else if (matchingTrend.trendScore < 30) {
      category = "NEW";
    }

    // Generate recommendation
    let recommendation = "";
    const hasStock = (product.inventory?.quantity ?? 0) > 0;

    if (category === "HOT" && hasStock) {
      recommendation = `SP đang trending mạnh! Đẩy mạnh QC + tăng tồn kho.`;
    } else if (category === "HOT" && !hasStock) {
      recommendation = `⚠️ SP đang HOT nhưng HẾT HÀNG! Nhập gấp để không mất cơ hội.`;
    } else if (category === "DECLINING") {
      recommendation = `SP đang giảm trend. Xả hàng tồn, giảm nhập mới.`;
    } else if (priceDiff?.includes("đắt hơn")) {
      recommendation = `Giá cao hơn thị trường. Cân nhắc giảm giá hoặc thêm giá trị (quà tặng, freeship).`;
    } else {
      recommendation = `Ổn định. Duy trì chiến lược hiện tại.`;
    }

    comparisons.push({
      productName: product.name,
      productSku: product.sku,
      yourPrice: product.sellPrice,
      marketAvgPrice: matchingTrend.avgPrice,
      priceDiff,
      trendScore: matchingTrend.trendScore,
      trendChange: matchingTrend.changePercent
        ? `${matchingTrend.changePercent > 0 ? "+" : ""}${matchingTrend.changePercent}%`
        : null,
      competitorCount: matchingTrend.competitorCount,
      recommendation,
      category,
    });
  }

  // Sort: HOT first, then DECLINING (urgent), then rest
  const priority = { HOT: 0, DECLINING: 1, NEW: 2, STABLE: 3 };
  comparisons.sort((a, b) => priority[a.category] - priority[b.category]);

  return comparisons;
}

/**
 * Get a market intelligence summary (uses existing data, doesn't fetch new).
 */
export async function getMarketSummary() {
  const trends = await prisma.sbMarketTrend.findMany({
    orderBy: { fetchedAt: "desc" },
    distinct: ["keyword"],
    take: 15,
  });

  const hotTrends = trends.filter((t) => t.trendScore >= 70 && (t.changePercent ?? 0) > 20);
  const decliningTrends = trends.filter((t) => (t.changePercent ?? 0) < -15);

  return {
    totalKeywordsTracked: trends.length,
    hotTrends: hotTrends.map((t) => ({
      keyword: t.keyword,
      trendScore: t.trendScore,
      change: `+${t.changePercent}%`,
    })),
    decliningTrends: decliningTrends.map((t) => ({
      keyword: t.keyword,
      trendScore: t.trendScore,
      change: `${t.changePercent}%`,
    })),
    lastFetched: trends[0]?.fetchedAt ?? null,
  };
}
