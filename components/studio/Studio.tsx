'use client';

import { useState, useCallback } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { ImageFile } from '@/components/ui/ImageUploader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toastMessage } from '@/lib/toast';
import { STYLE_PRESETS, SCENE_PRESETS } from '@/lib/presets';
import { cn } from '@/lib/utils';

interface Turn {
  uuid: string;
  turnIndex: number;
  type: string;
  userPrompt: string;
  imageUrl: string;
  status: string;
}

interface Generation {
  uuid: string;
  title: string | null;
  prompt: string;
  imageUrl: string | null;
  aspectRatio: string;
  quality: string;
  turnCount: number;
}

const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'] as const;
const QUALITIES = [
  { key: 'low', label: '低' },
  { key: 'medium', label: '中' },
  { key: 'high', label: '高' },
] as const;

/** 拉取作品的完整轮次历史 */
async function fetchTurns(uuid: string): Promise<Turn[]> {
  const resp = await fetch(`/api/generations/${uuid}`);
  const data = await resp.json();
  if (data.code !== 0 || !data.data?.turns) return [];
  return data.data.turns as Turn[];
}

export default function Studio() {
  const { isSignedIn } = useUser();

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<string | undefined>(undefined);
  const [scene, setScene] = useState<string | undefined>(undefined);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [quality, setQuality] = useState<string>('high');
  const [refImages, setRefImages] = useState<ImageFile[]>([]);

  const [generation, setGeneration] = useState<Generation | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [baseTurnIndex, setBaseTurnIndex] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // 当前展示的图：选中基准轮的输出
  const displayImage =
    turns.find((t) => t.turnIndex === baseTurnIndex)?.imageUrl ?? generation?.imageUrl ?? null;

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toastMessage('请输入提示词', 'warning');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('prompt', prompt.trim());
      if (style) fd.append('style', style);
      if (scene) fd.append('scene', scene);
      fd.append('aspectRatio', aspectRatio);
      fd.append('quality', quality);
      refImages.forEach((img) => fd.append('refImages', img.file));

      const resp = await fetch('/api/generate', { method: 'POST', body: fd });
      const data = await resp.json();
      if (data.code !== 0) {
        toastMessage(data.message || '生成失败', 'error');
        return;
      }
      const g = data.data.generation as Generation;
      setGeneration(g);
      const t = await fetchTurns(g.uuid);
      setTurns(t);
      setBaseTurnIndex(t.length - 1);
      toastMessage('生成成功', 'success');
    } catch (e) {
      toastMessage(e instanceof Error ? e.message : '网络错误', 'error');
    } finally {
      setLoading(false);
    }
  }, [prompt, style, scene, aspectRatio, quality, refImages]);

  const handleEdit = useCallback(async () => {
    if (!generation) return;
    if (!editPrompt.trim()) {
      toastMessage('请输入调整指令', 'warning');
      return;
    }
    setEditLoading(true);
    try {
      const fd = new FormData();
      fd.append('generationUuid', generation.uuid);
      fd.append('prompt', editPrompt.trim());
      fd.append('quality', quality);
      if (style) fd.append('style', style);
      fd.append('fromTurnIndex', String(baseTurnIndex));

      const resp = await fetch('/api/edit', { method: 'POST', body: fd });
      const data = await resp.json();
      if (data.code !== 0) {
        toastMessage(data.message || '编辑失败', 'error');
        return;
      }
      const g = data.data.generation as Generation;
      setGeneration(g);
      const t = await fetchTurns(g.uuid);
      setTurns(t);
      setBaseTurnIndex(t.length - 1);
      setEditPrompt('');
      toastMessage('调整完成', 'success');
    } catch (e) {
      toastMessage(e instanceof Error ? e.message : '网络错误', 'error');
    } finally {
      setEditLoading(false);
    }
  }, [generation, editPrompt, quality, style, baseTurnIndex]);

  const selectTurn = useCallback((idx: number) => {
    setBaseTurnIndex(idx);
  }, []);

  if (!isSignedIn) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">请先登录后开始创作</p>
        <SignInButton mode="modal">
          <Button>登录</Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">AI 图像工作室</h1>
        <p className="text-sm text-muted-foreground">用提示词生成与精修图像，多轮调整直到满意</p>
      </header>

      <main className="grid gap-6 p-6 lg:grid-cols-[400px_1fr]">
        {/* 左：输入区 */}
        <section className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium">提示词</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的画面，例如：一只在月光下的橘猫，坐在窗台上看星星"
              className="h-28 w-full resize-none rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* 场景模板：点击填入示例 */}
          <div>
            <label className="mb-2 block text-sm font-medium">场景模板</label>
            <div className="flex flex-wrap gap-2">
              {SCENE_PRESETS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setScene(s.key);
                    setPrompt((p) => (p.trim() ? p : s.examplePrompt));
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    scene === s.key
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input hover:bg-secondary'
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* 风格 */}
          <div>
            <label className="mb-2 block text-sm font-medium">风格</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStyle(style === s.key ? undefined : s.key)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    style === s.key
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input hover:bg-secondary'
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* 宽高比 + 质量 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">宽高比</label>
              <div className="flex flex-wrap gap-1">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAspectRatio(r)}
                    className={cn(
                      'rounded border px-2 py-1 text-xs',
                      aspectRatio === r
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:bg-secondary'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">质量</label>
              <div className="flex gap-1">
                {QUALITIES.map((q) => (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => setQuality(q.key)}
                    className={cn(
                      'flex-1 rounded border px-2 py-1 text-xs',
                      quality === q.key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:bg-secondary'
                    )}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 参考图（图生图） */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              参考图 <span className="text-xs text-muted-foreground">（可选，上传后走图生图）</span>
            </label>
            <ImageUploader maxImages={6} onImagesChange={setRefImages} />
          </div>

          <Button onClick={handleGenerate} disabled={loading} size="lg" className="w-full">
            {loading ? '生成中…' : '生成图像'}
          </Button>
        </section>

        {/* 右：结果区 */}
        <section className="flex flex-col gap-4">
          <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/30">
            {loading && !generation ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <LoadingSpinner />
                <span className="text-sm">正在生成，通常需要 10–30 秒…</span>
              </div>
            ) : displayImage ? (
              // 远程 R2 图，用 <img> 避开 next/image remotePatterns 配置
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt={generation?.title || '生成结果'}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">输入提示词后点击「生成图像」</p>
            )}
          </div>

          {/* 操作行：下载 */}
          {displayImage && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={displayImage} download={`${generation?.uuid ?? 'image'}.png`}>
                  下载
                </a>
              </Button>
            </div>
          )}

          {/* 继续调整 */}
          {generation && (
            <div className="flex gap-2">
              <input
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !editLoading) handleEdit();
                }}
                placeholder="继续调整，例如：把背景换成海边、改成暖色调、添加一只小狗"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={handleEdit} disabled={editLoading}>
                {editLoading ? '调整中…' : '再次调整'}
              </Button>
            </div>
          )}

          {/* 历史时间线 */}
          {turns.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                历史版本 <span className="text-xs text-muted-foreground">（点击选择编辑基准）</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {turns.map((t) => (
                  <button
                    key={t.uuid || t.turnIndex}
                    type="button"
                    onClick={() => selectTurn(t.turnIndex)}
                    title={t.userPrompt}
                    className={cn(
                      'relative h-16 w-16 overflow-hidden rounded border-2',
                      t.turnIndex === baseTurnIndex
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.imageUrl}
                      alt={`版本 ${t.turnIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-black/60 px-1 text-[10px] text-white">
                      {t.turnIndex + 1}
                    </span>
                  </button>
                ))}
              </div>
              {baseTurnIndex < turns.length - 1 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  已选择第 {baseTurnIndex + 1} 版作为基准，新调整将基于此版本
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
