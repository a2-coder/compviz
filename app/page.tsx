import { IconBrandGithub } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
              by <span className="font-bold">@a2coder</span>
            </p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              // ponytail: repo URL assumed from the other a2coder labs repos
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
      </header>
      <Separator />
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-4 p-2 md:p-4 lg:grid-cols-2 lg:gap-8 lg:p-8">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Compose</CardTitle>
            <CardDescription>Paste a Docker Compose file</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="compose">compose.yaml</FieldLabel>
                <Textarea id="compose" className="min-h-80" placeholder="services:" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Diagram</CardTitle>
            <CardDescription>See how the services connect</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Empty className="aspect-square">
              <EmptyHeader>
                <EmptyTitle>No diagram yet</EmptyTitle>
                <EmptyDescription>Paste a Compose file to draw it</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
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
