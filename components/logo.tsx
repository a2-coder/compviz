import type { ComponentProps } from "react";

// Inline copy of public/logo.svg: neutral cubes follow currentColor so they theme with `.dark`.
export function Logo(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label="compviz" role="img" {...props}>
      <defs>
        <mask id="compviz-cube-cut" maskUnits="userSpaceOnUse" x="-12" y="-12" width="24" height="24">
          <path d="M0-9 9-4.5v9L0 9-9 4.5v-9z" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
          <g stroke="#000" strokeLinecap="round" strokeWidth=".9">
            <path d="M0 0-10-5M0 0 10-5M0 0v10" />
            <path d="M-7 -1.5v5M-4.75 -.4v5M-2.5 .75v5" />
          </g>
        </mask>
        <path id="compviz-cube" d="M0-9 9-4.5v9L0 9-9 4.5v-9z" strokeWidth="1" strokeLinejoin="round" mask="url(#compviz-cube-cut)" />
      </defs>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23.8 24.1 19.8 26.1Q17 27.5 17 30v.2M40.2 24.1l4 2Q47 27.5 47 30v.2" />
        <circle cx="17" cy="32" r="1.6" />
        <circle cx="47" cy="32" r="1.6" />
        <path d="M17 33.8V35.5M47 33.8V35.5" />
      </g>
      <use href="#compviz-cube" x="17" y="44" fill="currentColor" stroke="currentColor" />
      <use href="#compviz-cube" x="47" y="44" fill="currentColor" stroke="currentColor" />
      <use href="#compviz-cube" x="32" y="20" className="fill-orange-500 stroke-orange-500" />
    </svg>
  );
}
