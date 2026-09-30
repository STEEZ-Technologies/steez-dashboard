export function PageHeader({
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  // flex-wrap + min-w-0 keep the action buttons on the page at narrow widths;
  // without them the action node refuses to shrink and pushes the whole page
  // into horizontal scroll.
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {/* `eyebrow` is still accepted but not drawn: the breadcrumbs in the
            header already say where you are. */}
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
