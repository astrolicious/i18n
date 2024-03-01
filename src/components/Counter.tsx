import { useState } from "react";
import { locale, getLocalePath } from "i18n:astro/client";

console.log('A')
console.log({ locale, path: getLocalePath("/about") });
console.log('B')
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
