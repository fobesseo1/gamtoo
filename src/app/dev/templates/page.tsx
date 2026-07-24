import Image from "next/image";
import { getAllTemplates } from "@/lib/templates";
import { getCharacterAssetPath } from "@/lib/characters/registry";

export default function DevTemplatesPage() {
  const templates = getAllTemplates();

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">템플릿 레지스트리 ({templates.length}개)</h1>
        <p className="text-sm text-zinc-500">
          템플릿 데이터 구조와 레지스트리 동작을 확인하기 위한 개발용 페이지입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
          >
            <div className="mb-1 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {template.category}
            </div>
            <h2 className="font-semibold">{template.name}</h2>
            <p className="text-xs text-zinc-500">{template.id}</p>
            <p className="mt-2 text-xs text-zinc-500">
              layers: {template.layers.length} / canvas: {template.canvasSize.width}x
              {template.canvasSize.height}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">캐릭터 플레이스홀더</h2>
        <div className="grid grid-cols-5 gap-3">
          {(["seal", "bichon", "panda", "bear", "mochi"] as const).map((name) => (
            <Image
              key={name}
              src={getCharacterAssetPath(name, "amazed")}
              alt={name}
              width={100}
              height={100}
              className="rounded-full"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
