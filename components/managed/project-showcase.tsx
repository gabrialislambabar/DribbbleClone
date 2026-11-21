import Image from "next/image";

type ShowcaseItem = {
  src: string;
  alt: string;
  caption: string;
  meta: string;
};

const FEATURE: ShowcaseItem = {
  src: "/designers/hello-lab/nimbus.png",
  alt: "Placeholder campaign visual: pink gradient card titled Nebula",
  caption: "Nebula",
  meta: "Launch campaign",
};

const SECONDARY: ShowcaseItem[] = [
  {
    src: "/designers/hello-lab/orbit.png",
    alt: "Placeholder campaign visual: blue gradient card titled Atlas",
    caption: "Atlas",
    meta: "Product launch",
  },
  {
    src: "/designers/hello-lab/ribbon.png",
    alt: "Placeholder campaign visual: green gradient card titled Bloom",
    caption: "Bloom",
    meta: "Social set",
  },
  {
    src: "/designers/hello-lab/grid.png",
    alt: "Placeholder campaign visual: violet gradient card titled Orbit",
    caption: "Orbit",
    meta: "Seasonal sale",
  },
];

function Tile({
  item,
  className,
  aspect,
  sizes,
}: {
  item: ShowcaseItem;
  className: string;
  aspect: string;
  sizes: string;
}) {
  return (
    <figure
      className={`group relative min-w-0 overflow-hidden rounded-2xl border border-border bg-surface ${className}`}
    >
      <div className={`relative w-full ${aspect}`}>
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-foreground/70 to-transparent px-4 pt-8 pb-3 text-xs text-white">
        <span className="truncate font-medium">{item.caption}</span>
        <span className="shrink-0 text-white/80">{item.meta}</span>
      </figcaption>
    </figure>
  );
}

export function ProjectShowcase() {
  return (
    <div className="mx-auto mt-12 w-full max-w-5xl">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1fr]">
        <Tile
          item={FEATURE}
          className="lg:h-[560px]"
          aspect="aspect-[4/5] lg:aspect-auto lg:h-full"
          sizes="(max-width: 1024px) 100vw, 40vw"
        />

        <div className="grid min-w-0 grid-cols-2 gap-4">
          <div className="col-span-2">
            <Tile
              item={SECONDARY[0]}
              className="lg:h-[300px]"
              aspect="aspect-[16/9] lg:aspect-auto lg:h-full"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
          {SECONDARY.slice(1).map((item) => (
            <Tile
              key={item.caption}
              item={item}
              className="lg:h-[244px]"
              aspect="aspect-[4/3] lg:aspect-auto lg:h-full"
              sizes="(max-width: 640px) 50vw, 30vw"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
