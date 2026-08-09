"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Approvals Page
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Loader2 } from "lucide-react";

interface ApprovalItem {
  id: string;
  workflowId: string;
  requestType: string;
  status: string;
  requestedBy?: string | null;
  approverId?: string | null;
  notes?: string | null;
  createdAt: string;
}

const statusVariants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/approvals")
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" />
          Phê duyệt
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Quản lý các yêu cầu chờ phê duyệt
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Yêu cầu phê duyệt ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải...
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Chưa có yêu cầu phê duyệt nào.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.requestType}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.requestedBy ?? "Không rõ"} •{" "}
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusVariants[item.status] ?? "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
