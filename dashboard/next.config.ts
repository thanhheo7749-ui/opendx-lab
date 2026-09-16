// ==============================================================================
// OpenDX-Lab / ShopWise
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
