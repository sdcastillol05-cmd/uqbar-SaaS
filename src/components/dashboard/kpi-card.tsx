"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  color: string; // hex, e.g. "#00BBFF"
  label: string;
  value: string;
  sub: string;
  badge?: { label: string; icon?: LucideIcon };
  delay?: number;
  className?: string;
}

export function KpiCard({
  icon: Icon,
  color,
  label,
  value,
  sub,
  badge,
  delay = 0,
  className,
}: KpiCardProps) {
  const BadgeIcon = badge?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        className={cn(
          "group relative h-full overflow-hidden p-5 gap-2 border-card-foreground/5 transition-shadow",
          className
        )}
        style={{
          backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${color} 7%, transparent) 0%, transparent 55%)`,
        }}
      >
        {/* Primary glow orb, top-right */}
        <div
          className="pointer-events-none absolute -top-1/2 -right-[30%] w-40 h-40 rounded-full blur-2xl opacity-25 transition-opacity duration-300 group-hover:opacity-40"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 70%)`,
          }}
        />
        {/* Secondary, smaller glow bottom-left for more depth */}
        <div
          className="pointer-events-none absolute -bottom-10 -left-8 w-24 h-24 rounded-full blur-2xl opacity-[0.12]"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 70%)`,
          }}
        />
        {/* Hairline gradient border accent along the top edge */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-px opacity-60"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />

        <div className="relative z-10 flex items-center justify-between mb-3">
          <div
            className="flex items-center justify-center w-9.5 h-9.5 rounded-xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} 16%, var(--card))`,
              boxShadow: `0 0 16px color-mix(in srgb, ${color} 30%, transparent) inset, 0 2px 8px color-mix(in srgb, ${color} 20%, transparent)`,
            }}
          >
            <Icon className="size-[17px]" style={{ color }} />
          </div>
          {badge && (
            <Badge className="gap-1 bg-success/10 text-success border-0 shadow-[0_0_10px_var(--success)_inset]/30 font-semibold">
              {BadgeIcon && <BadgeIcon className="size-3" />}
              {badge.label}
            </Badge>
          )}
        </div>
        <span className="relative z-10 text-[0.78rem] text-muted-foreground font-medium">
          {label}
        </span>
        <span className="text-display relative z-10 text-[1.7rem] leading-tight">
          {value}
        </span>
        <span className="relative z-10 text-[0.74rem] text-muted-foreground">
          {sub}
        </span>
      </Card>
    </motion.div>
  );
}
