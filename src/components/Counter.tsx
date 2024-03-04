import { useState } from "react";
import { t, useI18n } from "i18n:astro/client";
// import Astro from "astro:global"

// TODO: not working, use AsyncLocalStorage myself
let Astro!: any;

if (import.meta.env.SSR) {
  Astro = await import("astro:global").then(mod => mod.default)
}

const { locale, getLocalePath, switchLocalePath } = useI18n(Astro);

console.log("A");
console.log({
  locale,
  path: getLocalePath("/about/"),
  switch: {
    en: switchLocalePath("en"),
    fr: switchLocalePath("fr"),
  },
});
console.log("B");
console.log(t("home"));
export default function Counter({
  children,
  count: initialCount,
}: {
  children: JSX.Element;
  count: number;
}) {
  const [count, setCount] = useState(initialCount);
  const add = () => setCount((i) => i + 1);
  const subtract = () => setCount((i) => i - 1);

  return (
    <>
      <div>
        <button onClick={subtract}>-</button>
        <pre>{count}</pre>
        <button onClick={add}>+</button>
      </div>
      <div>{children}</div>
    </>
  );
}
