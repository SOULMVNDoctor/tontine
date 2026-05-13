"use client";

import { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-2xl px-4 py-3 font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed " +
        "bg-accent text-white hover:brightness-110 " +
        className
      }
    />
  );
}

export function ButtonGhost({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-2xl px-4 py-3 font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed " +
        "bg-black/5 text-foreground hover:bg-black/10 border border-black/10 " +
        className
      }
    />
  );
}
