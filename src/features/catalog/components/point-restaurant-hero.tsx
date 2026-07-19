"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, Pizza, Sparkles } from "lucide-react";
import { nenosEase } from "@/lib/motion/nenos-motion";

const FLOATING_PIZZAS = [
  {
    src: "/menu/point-da-pizza/pizza-mucarela-base.webp",
    className: "-bottom-10 -right-8 h-44 w-44 sm:-bottom-20 sm:right-[5%] sm:h-72 sm:w-72",
    delay: 0,
  },
  {
    src: "/menu/point-da-pizza/pizza-bauru-base.webp",
    className: "right-[24%] top-8 hidden h-28 w-28 lg:block",
    delay: 0.7,
  },
  {
    src: "/menu/point-da-pizza/meio-calabresa-meio-frango-media.webp",
    className: "-right-5 top-4 h-20 w-20 sm:right-[2%] sm:top-8 sm:h-28 sm:w-28",
    delay: 1.15,
  },
] as const;

export function PointRestaurantHero({
  restaurantName,
  logoUrl,
}: {
  restaurantName: string;
  logoUrl: string | null;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative h-[21rem] overflow-hidden bg-[#120a05] sm:h-[27rem]">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{
          scale: reduceMotion ? 1 : [1.04, 1.09, 1.04],
          opacity: 1,
        }}
        transition={
          reduceMotion
            ? { duration: 0.5, ease: nenosEase }
            : { opacity: { duration: 0.65 }, scale: { duration: 16, repeat: Infinity, ease: "easeInOut" } }
        }
      >
        <Image
          src="/menu/point-da-pizza/pizza-pepperoni-base.webp"
          alt="Pizza artesanal do Point da Pizza"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,7,2,0.98)_0%,rgba(24,10,3,0.88)_38%,rgba(33,13,3,0.42)_70%,rgba(18,7,2,0.5)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_55%,rgba(249,115,22,0.36),transparent_38%)]" />
      <motion.div
        aria-hidden="true"
        className="absolute -left-20 bottom-[-8rem] h-72 w-72 rounded-full bg-orange-600/30 blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.38, 0.72, 0.38], scale: [0.9, 1.16, 0.9] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {FLOATING_PIZZAS.map((pizza) => (
        <motion.div
          key={pizza.src}
          aria-hidden="true"
          className={`absolute overflow-hidden rounded-full border border-white/15 bg-black/30 shadow-[0_28px_70px_rgba(0,0,0,0.45)] ${pizza.className}`}
          initial={{ opacity: 0, scale: 0.72, rotate: -10 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: reduceMotion ? 0 : [0, 2.5, -2, 0],
            y: reduceMotion ? 0 : [0, -9, 0],
          }}
          transition={{
            opacity: { duration: 0.65, delay: pizza.delay },
            scale: { duration: 0.65, delay: pizza.delay, ease: nenosEase },
            rotate: { duration: 8 + pizza.delay, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 4.6 + pizza.delay, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <Image src={pizza.src} alt="" fill sizes="288px" className="object-cover" />
          <span className="absolute inset-0 rounded-full ring-8 ring-black/15 ring-inset" />
        </motion.div>
      ))}

      <div className="container relative z-10 flex h-full items-center">
        <motion.div
          initial={{ opacity: 0, x: -34 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.62, ease: nenosEase }}
          className="max-w-[76%] pb-8 sm:max-w-xl sm:pb-14"
        >
          <div className="mb-5 flex items-center gap-3">
            <motion.div
              className="relative h-16 w-16 overflow-hidden rounded-[1.35rem] border border-orange-400/70 bg-[#18110d] shadow-[0_0_0_5px_rgba(249,115,22,0.12),0_18px_45px_rgba(0,0,0,0.4)] sm:h-20 sm:w-20"
              animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, -1.5, 1.5, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`Logo ${restaurantName}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-primary text-white">
                  <Pizza className="h-8 w-8" />
                </span>
              )}
            </motion.div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-500/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.17em] text-orange-100 backdrop-blur-md sm:text-xs">
              <Flame className="h-4 w-4 text-orange-400" />
              Sabor que chega quente
            </div>
          </div>

          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-400">
            <Sparkles className="h-4 w-4" /> Feita para compartilhar
          </p>
          <h2 className="max-w-lg text-balance text-3xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            O seu point de <span className="text-orange-400">pizza</span> em Maceió.
          </h2>
          <p className="mt-4 hidden max-w-md text-sm leading-relaxed text-white/65 sm:block sm:text-base">
            Massa artesanal, ingredientes selecionados e aquele sabor de forno que reúne todo mundo.
          </p>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#120a05] to-transparent" />
    </section>
  );
}
