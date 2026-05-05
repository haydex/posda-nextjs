import LikeCounter from "@/components/LikeCounter";
import { Card } from "@/components/ui/Card";
import {
  PageHeader,
  PageShell,
  PageSubtitle,
  PageTitle,
} from "@/components/ui/Page";

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
    <PageShell size="3xl">
      <PageHeader>
        <PageTitle>Server Component Data Fetching</PageTitle>
      </PageHeader>
      <PageSubtitle>
        This page fetches data on the server before rendering in the browser.
      </PageSubtitle>

      <LikeCounter />

      <ul className="mt-8 space-y-4">
        {posts.map((post) => (
          <Card as="li" key={post.id}>
            <h2 className="font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {post.body}
            </p>
          </Card>
        ))}
      </ul>
    </PageShell>
  );
}
