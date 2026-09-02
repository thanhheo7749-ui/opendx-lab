// ==============================================================================
// OpenDX-Lab — Health Check API: Ping all 7 infrastructure services
// SPDX-License-Identifier: GPL-3.0-or-later
//
// GET /api/health → real-time status of every container
// ==============================================================================

import { NextResponse } from "next/server";

interface ServiceStatus {
  name: string;
  layer: "H" | "P" | "D" | "I";
  status: "UP" | "DOWN";
  responseMs: number;
  url: string;
  version?: string;
}

const SERVICES: { name: string; layer: "H" | "P" | "D" | "I"; url: string; healthPath: string }[] = [
  { name: "PostgreSQL",   layer: "D", url: "http://postgres:5432",    healthPath: "__tcp__" },
  { name: "Keycloak",     layer: "H", url: "http://keycloak:8080",    healthPath: "/realms/master" },
  { name: "Mattermost",   layer: "H", url: "http://mattermost:8065",  healthPath: "/api/v4/system/ping" },
  { name: "Wiki.js",      layer: "H", url: "http://wikijs:3000",      healthPath: "/healthz" },
  { name: "Activepieces", layer: "P", url: "http://activepieces:80",  healthPath: "/api/v1/flags" },
  { name: "Metabase",     layer: "D", url: "http://metabase:3000",    healthPath: "/api/health" },
  { name: "Ollama",       layer: "I", url: "http://ollama:11434",     healthPath: "/api/tags" },
];

async function pingService(service: typeof SERVICES[0]): Promise<ServiceStatus> {
  const start = Date.now();

  // PostgreSQL doesn't have HTTP — check via Prisma connection
  if (service.healthPath === "__tcp__") {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$queryRaw`SELECT 1`;
      return {
        name: service.name,
        layer: service.layer,
        status: "UP",
        responseMs: Date.now() - start,
        url: service.url,
        version: "16 (pgvector)",
      };
    } catch {
      return {
        name: service.name,
        layer: service.layer,
        status: "DOWN",
        responseMs: Date.now() - start,
        url: service.url,
      };
    }
  }

  // HTTP ping
  try {
    const res = await fetch(`${service.url}${service.healthPath}`, {
      signal: AbortSignal.timeout(5000),
    });

    return {
      name: service.name,
      layer: service.layer,
      status: res.ok || res.status === 401 ? "UP" : "DOWN", // 401 = running but auth needed
      responseMs: Date.now() - start,
      url: service.url,
    };
  } catch {
    return {
      name: service.name,
      layer: service.layer,
      status: "DOWN",
      responseMs: Date.now() - start,
      url: service.url,
    };
  }
}

export async function GET() {
  const results = await Promise.all(SERVICES.map(pingService));

  const upCount = results.filter((r) => r.status === "UP").length;
  const totalCount = results.length;

  return NextResponse.json({
    overall: upCount === totalCount ? "HEALTHY" : upCount > 0 ? "DEGRADED" : "DOWN",
    upCount,
    totalCount,
    services: results,
    timestamp: new Date().toISOString(),
  });
}
