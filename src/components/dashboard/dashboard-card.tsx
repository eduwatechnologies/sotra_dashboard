import type { ReactNode } from "react";

export function DashboardCard({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-white/[0.075] bg-[#101318]/90 shadow-[0_12px_42px_rgba(0,0,0,0.12)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#f3f1ec]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[#858b96]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
