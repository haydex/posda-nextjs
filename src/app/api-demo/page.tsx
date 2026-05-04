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
    <main className="page-shell page-shell-3xl">
      <div className="page-header">
        <h1 className="page-title">API Demo</h1>
      </div>
      <p className="page-subtitle">
        This page calls <code>/api/hello</code> from the browser.
      </p>

      <section className="section-card">
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
          className="btn btn-primary btn-md mt-4"
        >
          Refresh
        </button>
      </section>
    </main>
  );
}
