"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Collection = {
  collection_id: number;
  collection_code: string;
  collection_type: number;
  collection_short_title: string;
  collection_title: string;
  collection_name: string;
  active: boolean;
  when_created: string;
  who_created: string;
};

type CollectionResponse = {
  collection: Collection;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function CollectionByIdPage({ params }: PageProps) {
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [data, setData] = useState<CollectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCollection() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setCollectionId(id);

      try {
        const response = await fetch(`/api/collections/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load collection ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as CollectionResponse;

        if (!isMounted) {
          return;
        }

        setData(json);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError(`Could not load collection ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCollection();

    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Collection Details
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {collectionId
          ? `Showing /collections/${collectionId}`
          : "Loading collection id..."}
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">ID</dt>
              <dd>{data.collection.collection_id}</dd>
            </div>
            <div>
              <dt className="font-medium">Code</dt>
              <dd>{data.collection.collection_code}</dd>
            </div>
            <div>
              <dt className="font-medium">Short Title</dt>
              <dd>{data.collection.collection_short_title}</dd>
            </div>
            <div>
              <dt className="font-medium">Collection Name</dt>
              <dd>{data.collection.collection_name}</dd>
            </div>
            <div>
              <dt className="font-medium">Collection Title</dt>
              <dd>{data.collection.collection_title}</dd>
            </div>
            <div>
              <dt className="font-medium">Type</dt>
              <dd>{data.collection.collection_type}</dd>
            </div>
            <div>
              <dt className="font-medium">Active</dt>
              <dd>{data.collection.active ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-medium">Created By</dt>
              <dd>{data.collection.who_created}</dd>
            </div>
            <div>
              <dt className="font-medium">Created At</dt>
              <dd>{new Date(data.collection.when_created).toLocaleString()}</dd>
            </div>
          </dl>
        )}

        <Link
          href="/collections"
          className="mt-4 inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Back to Collections
        </Link>
      </section>
    </main>
  );
}
