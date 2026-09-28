"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">خطایی رخ داد</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {error.message || "خطایی در سرور رخ داده است. لطفاً دوباره تلاش کنید."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        تلاش دوباره
      </button>
    </div>
  );
}
