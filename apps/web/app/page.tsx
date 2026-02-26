"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkSetupStatus } from "../lib/api";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSetupStatus()
      .then(({ configured }) => {
        if (configured) {
          router.replace("/connections");
        } else {
          router.replace("/setup");
        }
      })
      .catch(() => {
        // If backend is unreachable, go to setup
        router.replace("/setup");
      })
      .finally(() => setChecking(false));
  }, [router]);

  if (!checking) return null;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-foreground-muted text-sm">Loading Verba...</p>
      </div>
    </div>
  );
}
