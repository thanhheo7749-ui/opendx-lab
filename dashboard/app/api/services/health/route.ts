// ==============================================================================
// OpenDX-Lab Dashboard - Service Health Check API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ServiceHealth {
  name: string;
  status: "UP" | "DOWN";
  url: string;
  port: number;
  description: string;
  responseTime?: number;
  checkedAt: string;
}

async function checkService(
  name: string,
  internalUrl: string,
  externalPort: number,
  description: string,
  healthPath: string
): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${internalUrl}${healthPath}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    return {
      name,
      status: response.ok ? "UP" : "DOWN",
      url: `http://localhost:${externalPort}`,
      port: externalPort,
      description,
      responseTime: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      name,
      status: "DOWN",
      url: `http://localhost:${externalPort}`,
      port: externalPort,
      description,
      responseTime: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  }
}

async function checkPostgres(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: "PostgreSQL",
      status: "UP",
      url: "postgresql://localhost:5432",
      port: 5432,
      description: "Cơ sở dữ liệu quan hệ chung",
      responseTime: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      name: "PostgreSQL",
      status: "DOWN",
      url: "postgresql://localhost:5432",
      port: 5432,
      description: "Cơ sở dữ liệu quan hệ chung",
      responseTime: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function GET() {
  const keycloakUrl = process.env.KEYCLOAK_URL ?? "http://keycloak:8080";
  const mattermostUrl = process.env.MATTERMOST_URL ?? "http://mattermost:8065";
  const wikijsUrl = process.env.WIKIJS_URL ?? "http://wikijs:3000";
  const activepiecesUrl = process.env.ACTIVEPIECES_URL ?? "http://activepieces:80";
  const metabaseUrl = process.env.METABASE_URL ?? "http://metabase:3000";
  const ollamaUrl = process.env.OLLAMA_URL ?? "http://ollama:11434";

  const services = await Promise.all([
    checkService("Keycloak", keycloakUrl, 8080, "Quản lý định danh & SSO", "/realms/opendx"),
    checkService("Mattermost", mattermostUrl, 3100, "Giao tiếp nội bộ", "/api/v4/system/ping"),
    checkService("Wiki.js", wikijsUrl, 3200, "Quản lý tri thức", "/healthz"),
    checkService("Activepieces", activepiecesUrl, 5678, "Tự động hóa quy trình", "/api/v1/flags"),
    checkService("Metabase", metabaseUrl, 3300, "Phân tích & BI", "/api/health"),
    checkService("Ollama", ollamaUrl, 11434, "AI / LLM cục bộ", "/api/tags"),
    checkPostgres(),
  ]);

  const totalUp = services.filter((s) => s.status === "UP").length;

  return NextResponse.json({
    services,
    summary: {
      total: services.length,
      up: totalUp,
      down: services.length - totalUp,
    },
  });
}
