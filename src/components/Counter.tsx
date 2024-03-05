import { useState } from "react";
import { getLocale, getLocalePath, switchLocalePath, t } from "i18n:astro";

export default function Counter({
  children,
  count: initialCount,
}: {
  children: JSX.Element;
  count: number;
}) {
  console.log("A");
  console.log({
    locale: getLocale(),
    path: getLocalePath("/about"),
    switch: {
      en: switchLocalePath("en"),
      fr: switchLocalePath("fr"),
    },
  });
  console.log("B");
  console.log(t("home"));
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
