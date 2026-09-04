"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { UnifiedStage } from "@/admin/entity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

type ContextCard = {
  id: string;
  title: string;
  stages: UnifiedStage[];
  content: React.ReactNode;
};

export function EntityContextCards({
  stage,
  cards,
  defaultOpenIds = ["customer"],
}: {
  stage: UnifiedStage;
  cards: ContextCard[];
  defaultOpenIds?: string[];
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () =>
      new Set(
        cards
          .filter((card) => !defaultOpenIds.includes(card.id))
          .map((card) => card.id),
      ),
  );

  const visible = cards.filter((card) => card.stages.includes(stage));

  if (visible.length === 0) {
    return null;
  }

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {visible.map((card) => {
        const isCollapsed = collapsed.has(card.id);
        return (
          <Card key={card.id}>
            <CardHeader className="pb-2">
              <button
                type="button"
                onClick={() => toggle(card.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <CardTitle className="text-sm">
                  {isCollapsed ? "▶" : "▼"} {card.title}
                </CardTitle>
              </button>
            </CardHeader>
            {!isCollapsed ? (
              <CardContent className={cn("pt-0")}>{card.content}</CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
