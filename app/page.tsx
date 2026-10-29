import { IconBrandGithub } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ComposeDiagram } from "@/components/compose-diagram";
import { Guide } from "@/components/guide";
import { LiveCount } from "@/components/live-count";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between gap-2 p-2 md:p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center border-2 border-primary text-primary">
            <Logo className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold">compviz</h1>
            <p className="text-xs font-light text-muted-foreground">
              by{" "}
              <a
                href="https://www.a2coder.dev"
                target="_blank"
                rel="noreferrer"
                className="font-bold hover:text-foreground hover:underline"
              >
                @a2coder
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveCount />
          <Guide />
          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href="https://github.com/a2-coder/compviz"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open project on GitHub"
                  className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
                />
              }
            >
              <IconBrandGithub />
            </TooltipTrigger>
            <TooltipContent>Open project on GitHub</TooltipContent>
          </Tooltip>
        </div>
      </header>
      <Separator />
      <main className="min-h-0 flex-1">
        <ComposeDiagram />
      </main>
      <Separator />
      <footer className="p-2 text-center text-xs text-muted-foreground">
        Copyright © <CopyrightYear /> Arjun Palakkazhi. All rights reserved.
      </footer>
    </>
  );
}

async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}
