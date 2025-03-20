import Link from "next/link";

import { LatestPost } from "LA/app/_components/post";
import { api, HydrateClient } from "LA/trpc/server";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main>
        <p>Hello Wolrd!</p>
       
      </main>
    </HydrateClient>
  );
}
