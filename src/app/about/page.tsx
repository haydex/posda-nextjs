import LikeCounter from "@/components/LikeCounter";

type Post = {
  id: number;
  title: string;
  body: string;
};

async function getPosts(): Promise<Post[]> {
  const response = await fetch(
    "https://jsonplaceholder.typicode.com/posts?_limit=5",
    {
      next: { revalidate: 60 },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }

  return response.json();
}

export default async function AboutPage() {
  const posts = await getPosts();

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Server Component Data Fetching
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page fetches data on the server before rendering in the browser.
      </p>

      <LikeCounter />

      <ul className="mt-8 space-y-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="rounded-lg border border-black/10 p-4 dark:border-white/15"
          >
            <h2 className="font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {post.body}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
