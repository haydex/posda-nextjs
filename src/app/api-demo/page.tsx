"use client";

import { useEffect, useState } from "react";

type HelloResponse = {
  message: string;
  timestamp: string;
};

export default function ApiDemoPage() {
  const [data, setData] = useState<HelloResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHello() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/hello");

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as HelloResponse;
      setData(json);
    } catch {
      setError("Could not load API response.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHello();
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">API Demo</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page calls <code>/api/hello</code> from the browser.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Message:</span> {data.message}
            </p>
            <p>
              <span className="font-medium">Timestamp:</span> {data.timestamp}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void loadHello()}
          className="mt-4 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Refresh
        </button>
      </section>
    </main>
  );
}
