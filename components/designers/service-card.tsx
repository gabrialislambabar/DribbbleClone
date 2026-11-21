import { ClockIcon } from "@/components/ui/icons";
import type { DesignerService } from "@/lib/designers/types";

type ServiceCardProps = {
  service: DesignerService;
  onContact: () => void;
};

export function ServiceCard({ service, onContact }: ServiceCardProps) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{service.description}</p>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted">Scope</dt>
          <dd className="max-w-[60%] text-right text-foreground">{service.scope}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Delivery</dt>
          <dd className="inline-flex items-center gap-1 text-foreground">
            <ClockIcon className="h-3.5 w-3.5 text-muted" />
            {service.deliveryDays} days
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
          <dt className="text-muted">Starting at</dt>
          <dd className="font-semibold text-foreground">
            ${service.startingPrice.toLocaleString("en-US")}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onContact}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-white transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Get in touch
      </button>
    </article>
  );
}
