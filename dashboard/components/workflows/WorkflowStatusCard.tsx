"use client";

// ==============================================================================
// OpenDX-Lab / ShopWise
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const toneClasses = {
  default: "border-border",
  danger: "border-red-400/50 bg-red-500/10",
  success: "border-emerald-400/50 bg-emerald-500/10",
  warning: "border-amber-400/50 bg-amber-500/10",
  info: "border-blue-400/50 bg-blue-500/10",
};

export function WorkflowStatusCard({
  label,
  value,
  tone = "default",
  icon,
}: {
  label: string;
  value: number;
  tone?: keyof typeof toneClasses;
  icon?: React.ReactNode;
}) {
  return (
    <Card className={toneClasses[tone]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
