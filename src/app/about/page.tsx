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
    <main className="page-shell page-shell-3xl">
      <div className="page-header">
        <h1 className="page-title">Server Component Data Fetching</h1>
      </div>
      <p className="page-subtitle">
        This page fetches data on the server before rendering in the browser.
      </p>

      <LikeCounter />

      <ul className="mt-8 space-y-4">
        {posts.map((post) => (
          <li key={post.id} className="card">
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
