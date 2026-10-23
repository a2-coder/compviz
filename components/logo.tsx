import { IconHierarchy2 } from "@tabler/icons-react";
import type { ComponentProps } from "react";

// Same mark as public/logo.svg; follows currentColor so it themes with `.dark`.
export function Logo(props: ComponentProps<typeof IconHierarchy2>) {
  return <IconHierarchy2 aria-label="compviz" role="img" {...props} />;
}
