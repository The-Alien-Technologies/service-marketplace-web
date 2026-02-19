import { use } from "react";
import { Header } from "@/components/layout/header";
import { ReviewForm } from "./ReviewForm";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
        <div className="w-full max-w-5xl">
          <ReviewForm orderId={id} />
        </div>
      </main>
    </div>
  );
}
