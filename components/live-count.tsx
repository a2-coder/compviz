"use client";

import { IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Open tabs right now, via Supabase Realtime Presence; renders nothing unless both env vars are set and the channel is subscribed. */
export function LiveCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!URL || !KEY) return;
    let cleanup = () => {};
    let cancelled = false;
    import("@supabase/supabase-js").then(({ createClient }) => {
      if (cancelled) return;
      const supabase = createClient(URL, KEY);
      const channel = supabase.channel("compviz:presence", {
        config: { presence: { key: crypto.randomUUID() } },
      });
      channel
        .on("presence", { event: "sync" }, () => setCount(Object.keys(channel.presenceState()).length))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") channel.track({});
          else setCount(null);
        });
      cleanup = () => void supabase.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (count === null) return null;
  const label = `${count} Viewing Now`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={label}
            className="hidden items-center gap-1 px-2 text-xs text-muted-foreground sm:flex"
          />
        }
      >
        <IconUsers className="size-4" />
        {count}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
