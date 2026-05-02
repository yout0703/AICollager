import { Dictionary, getTranslation } from "@/lib/i18n";

interface SamplesProps {
  dict: Dictionary;
}

export default function Samples({ dict }: SamplesProps) {
  // 在组件内部创建 t 函数
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  return (
    <section className="mb-16">
      <div className="bg-secondary/60 rounded-lg border border-border p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 示例拼图布局1 */}
          <div className="bg-card rounded-lg border border-border overflow-hidden transition-colors hover:border-primary/30">
            <div className="aspect-[4/3] relative">
              <div className="grid grid-cols-2 h-full">
                <div className="bg-secondary"></div>
                <div className="bg-muted"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                {t('chooseLayout')}
              </div>
            </div>
            <div className="p-4">
              <p className="font-medium">2 x 1</p>
              <p className="text-sm text-muted-foreground">简单双分割</p>
            </div>
          </div>

          {/* 示例拼图布局2 */}
          <div className="bg-card rounded-lg border border-border overflow-hidden transition-colors hover:border-primary/30">
            <div className="aspect-[4/3] relative">
              <div className="grid grid-cols-2 grid-rows-2 h-full">
                <div className="bg-secondary"></div>
                <div className="bg-muted"></div>
                <div className="bg-muted"></div>
                <div className="bg-secondary"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                {t('chooseLayout')}
              </div>
            </div>
            <div className="p-4">
              <p className="font-medium">2 x 2</p>
              <p className="text-sm text-muted-foreground">四格棋盘</p>
            </div>
          </div>

          {/* 示例拼图布局3 */}
          <div className="bg-card rounded-lg border border-border overflow-hidden transition-colors hover:border-primary/30">
            <div className="aspect-[4/3] relative">
              <div className="grid grid-cols-3 h-full">
                <div className="bg-secondary"></div>
                <div className="bg-muted"></div>
                <div className="bg-secondary"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                {t('chooseLayout')}
              </div>
            </div>
            <div className="p-4">
              <p className="font-medium">3 x 1</p>
              <p className="text-sm text-muted-foreground">三列式</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
