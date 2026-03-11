"use client";

import { useState } from "react";

export default function LikeCounter() {
  const [likes, setLikes] = useState(0);

  return (
    <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
      <h2 className="text-lg font-semibold">Client Component Interactivity</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        This counter uses useState in the browser.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLikes((prev) => prev + 1)}
          className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Like
        </button>
        <button
          type="button"
          onClick={() => setLikes(0)}
          className="rounded-md border border-black/20 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Reset
        </button>
        <span className="text-sm font-medium">Likes: {likes}</span>
      </div>
    </section>
  );
}
