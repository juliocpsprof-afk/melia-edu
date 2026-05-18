"use client";

import { useEffect } from "react";

import { supabase } from "../lib/supabase";

export function RealtimeDashboardUpdater() {
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
        },

        () => {
          window.location.reload();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grades",
        },

        () => {
          window.location.reload();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
        },

        () => {
          window.location.reload();
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}