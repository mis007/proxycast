import type { ReactNode } from "react";
import {
  EMPTY_STATE_BADGE_BASE_CLASSNAME,
  EMPTY_STATE_BADGE_TONE_CLASSNAMES,
  EMPTY_STATE_CARD_SURFACE_CLASSNAME,
  EMPTY_STATE_ICON_TONE_CLASSNAMES,
  EMPTY_STATE_META_PILL_CLASSNAME,
} from "./emptyStateSurfaceTokens";

export interface EmptyStateHeroBadge {
  key: string;
  label: string;
  tone?: "slate" | "sky" | "emerald" | "amber";
}

export interface EmptyStateHeroCard {
  key: string;
  eyebrow: string;
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  tone?: "slate" | "sky" | "emerald" | "amber";
  action?: ReactNode;
}

export interface EmptyStateHeroFeature {
  key: string;
  title: string;
  description: string;
}

interface EmptyStateHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  badges: EmptyStateHeroBadge[];
  cards: EmptyStateHeroCard[];
  features?: EmptyStateHeroFeature[];
  prioritySlot?: ReactNode;
  supportingSlot?: ReactNode;
  themeTabs?: ReactNode;
}

export function EmptyStateHero({
  eyebrow,
  title,
  description,
  badges,
  cards,
  features = [],
  prioritySlot,
  supportingSlot,
  themeTabs,
}: EmptyStateHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(244,251,248,0.98)_0%,rgba(248,250,252,0.985)_46%,rgba(241,247,255,0.96)_100%)] shadow-sm shadow-slate-950/5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/90" />
      <div className="pointer-events-none absolute -left-24 top-[-86px] h-56 w-56 rounded-full bg-emerald-200/24 blur-3xl" />
      <div className="pointer-events-none absolute right-[-64px] top-[-18px] h-48 w-48 rounded-full bg-sky-200/26 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-86px] left-1/3 h-44 w-44 rounded-full bg-amber-200/16 blur-3xl" />
      <div className="relative space-y-3.5 p-4 lg:space-y-4 lg:p-5">
        <div className="mx-auto flex max-w-[48rem] flex-col items-center gap-2.5 text-center">
          <div className="inline-flex items-center rounded-full border border-emerald-200/80 bg-white/88 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-emerald-700 shadow-sm shadow-slate-950/5">
            {eyebrow}
          </div>

          <div className="space-y-2">
            <h1 className="max-w-[19ch] text-[28px] font-semibold tracking-tight text-slate-900 md:text-[32px]">
              {title}
            </h1>
            <p className="max-w-[44rem] text-[13px] leading-7 text-slate-600 md:text-sm">
              {description}
            </p>
          </div>

          {badges.length > 0 ? (
            <div className="flex max-w-[46rem] flex-wrap justify-center gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.key}
                  className={`${EMPTY_STATE_BADGE_BASE_CLASSNAME} ${
                    EMPTY_STATE_BADGE_TONE_CLASSNAMES[badge.tone || "slate"]
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}

          {themeTabs ? (
            <div className="flex w-full justify-center">{themeTabs}</div>
          ) : null}
        </div>

        {prioritySlot ? (
          <div className="mx-auto w-full max-w-[1020px]">{prioritySlot}</div>
        ) : null}

        {supportingSlot ? (
          <div className="mx-auto w-full max-w-[1020px]">{supportingSlot}</div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.key}
              className={EMPTY_STATE_CARD_SURFACE_CLASSNAME}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${
                    EMPTY_STATE_ICON_TONE_CLASSNAMES[card.tone || "slate"]
                  }`}
                >
                  {card.icon}
                </div>
                <span className={EMPTY_STATE_META_PILL_CLASSNAME}>
                  {card.eyebrow}
                </span>
              </div>

              <div className="mt-2.5 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {card.title}
                </div>
                <div className="line-clamp-1 text-[11px] font-medium text-slate-500">
                  {card.value}
                </div>
                <p className="line-clamp-3 text-[12px] leading-5 text-slate-500">
                  {card.description}
                </p>
              </div>

              {card.imageSrc ? (
                <div className="mt-3 overflow-hidden rounded-[18px] border border-slate-200/70 bg-slate-50">
                  <img
                    src={card.imageSrc}
                    alt={card.imageAlt || card.title}
                    className="h-[78px] w-full object-cover md:h-[88px] xl:h-[78px] 2xl:h-[92px]"
                  />
                </div>
              ) : null}

              {card.action ? <div className="mt-2.5">{card.action}</div> : null}
            </article>
          ))}
        </div>

        {features.length > 0 ? (
          <div className="hidden rounded-[22px] border border-white/85 bg-white/72 px-4 py-3.5 shadow-sm shadow-slate-950/5 backdrop-blur-sm md:block">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.key}
                  title={feature.description}
                  className="min-w-0 rounded-2xl border border-white/80 bg-white/74 px-3 py-2.5"
                >
                  <div className="text-[11px] font-semibold text-slate-700">
                    {feature.title}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default EmptyStateHero;
