"use client";

import React, { useEffect, useState, useMemo, useCallback, memo, useTransition } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "next/navigation";
import {
  Users,
  Target,
  UserCheck,
  Calendar,
  Layers,
  UserPlus,
  Wallet,
  Award,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// 1. Formatters instantiated OUTSIDE to prevent re-creation on every render
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const formatCount = (value, type = "number") => {
  const numericValue = Number(value) || 0;
  if (type === "currency") return currencyFormatter.format(numericValue);
  if (type === "text") return value ?? "0";
  return numberFormatter.format(numericValue);
};

// 2. Memoized Card Component
const Card = memo(({ title, count, color, Icon, type = "number" }) => (
  <div
    className="relative bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg border-l-4 border-gray-100 overflow-hidden h-[98px]" 
    style={{ borderLeftColor: color }}
  >
    <div className="p-5 flex justify-between items-center">
      <div className="space-y-1">
        <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold" style={{ color }}>
          {formatCount(count, type)}
        </p>
      </div>
      <div
        className="p-3 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
  </div>
));
Card.displayName = "Card";

// 3. Fixed Height Skeleton Card to prevent layout shift
const SkeletonCard = () => (
  <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-100 animate-pulse h-[98px]">
    <div className="flex justify-between items-center">
      <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
    </div>
    <div className="mt-4 w-1/3 h-7 bg-gray-200 rounded"></div>
  </div>
);

export default function Dashboard() {
  const params = useParams();
  const searchParams = useSearchParams();

  const dscode = params?.dscode;
  const email = searchParams.get("email");

  // React 18 Transition for smooth UI updates
  const [isPending, startTransition] = useTransition();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    panel: null,
    monthly: 0,
    closing: 0,
    week: { sao: 0, sgo: 0 },
  });

  const fetchData = useCallback(
    async (signal) => {
      if (!dscode) return;

      setLoading(true);
      setError(null);

      try {
        const [totalsRes, weekRes, panelRes] = await Promise.all([
          axios.get(`/api/userAccount/totaldashboard/${dscode}`, { signal }),
          axios.get(`/api/userpanel/weak/${dscode}`, { signal }),
          axios.get(`/api/userpanel/${dscode}`, { signal }),
        ]);

        // Wrap state updates in startTransition to prevent rendering lags
        startTransition(() => {
          setDashboardData({
            panel: panelRes.data || null,
            monthly: Number(totalsRes.data?.totalmonthly) || 0,
            closing: Number(totalsRes.data?.totalclosing) || 0,
            week: {
              sao: Number(weekRes.data?.totalSAORP) || 0,
              sgo: Number(weekRes.data?.totalSGORP) || 0,
            },
          });
          setLoading(false);
        });
      } catch (err) {
        if (axios.isCancel(err)) return; // Ignore canceled requests
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard metrics. Please try again.");
        setLoading(false);
      }
    },
    [dscode]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    return () => controller.abort(); 
  }, [fetchData]);

  // 4. Memoized Data Mapping
  const cardItems = useMemo(() => {
    const { panel, monthly, closing, week } = dashboardData;
    if (!panel) return [];

    return [
      { title: "SAO RP", count: panel.mainUser?.saosp, color: "#3293ba", Icon: Target },
      { title: "SGO RP", count: panel.mainUser?.sgosp, color: "#f28430", Icon: Target },
      { title: "Total SAO", count: panel.totalSAO, color: "#5cba47", Icon: Users },
      { title: "Total SGO", count: panel.totalSGO, color: "#a94dd6", Icon: Users },
      { title: "Active SAO", count: panel.totalActiveSAO, color: "#ff7b7b", Icon: UserCheck },
      { title: "Active SGO", count: panel.totalActiveSGO, color: "#2eb872", Icon: UserCheck },
      { title: "This Week SAO RP", count: week.sao, color: "#ffb347", Icon: Calendar },
      { title: "This Week SGO RP", count: week.sgo, color: "#7f55a3", Icon: Calendar },
      {
        title: "Current Level",
        count: panel.mainUser?.level,
        color: "#4a4a4a",
        Icon: Layers,
        type: "text",
      },
      { title: "Direct SAO", count: panel.directSao, color: "#3b82f6", Icon: UserPlus },
      { title: "Direct SGO", count: panel.directSgo, color: "#8b5cf6", Icon: UserPlus },
      {
        title: "Pair Matching Income",
        count: closing,
        color: "#d64d9b",
        Icon: Wallet,
        type: "currency",
      },
      {
        title: "Star Level Bonus",
        count: monthly,
        color: "#eab308",
        Icon: Award,
        type: "currency",
      },
      {
        title: "Total Income",
        count: closing + monthly,
        color: "#16a34a",
        Icon: Award,
        type: "currency",
      },
    ];
  }, [dashboardData]);

  // Combine standard loading state with transition pending state
  const isDataLoading = loading || isPending;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Error State with Retry Button */}
      {error && !isDataLoading && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 5. Match Skeleton count exactly to the 14 cards */}
        {isDataLoading
          ? Array.from({ length: 14 }).map((_, index) => <SkeletonCard key={index} />)
          : cardItems.map((item) => <Card key={item.title} {...item} />)}
      </div>
    </div>
  );
}