import { Dictionary } from "@/lib/i18n";

interface SamplesProps {
  dict: Dictionary;
  t: (key: string) => string;
}

export default function Samples({ t }: SamplesProps) {
  return (
    <section className="mb-16">
      <div className="bg-gray-50 rounded-2xl p-8 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 示例拼图布局1 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-[4/3] relative">
              <div className="grid grid-cols-2 h-full">
                <div className="bg-gray-200"></div>
                <div className="bg-gray-300"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                {t('chooseLayout')}
              </div>
            </div>
            <div className="p-4">
              <p className="font-medium">2 x 1</p>
              <p className="text-sm text-gray-500">简单双分割</p>
            </div>
          </div>
          
          {/* 示例拼图布局2 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-[4/3] relative">
              <div className="grid grid-cols-2 grid-rows-2 h-full">
                <div className="bg-gray-200"></div>
                <div className="bg-gray-300"></div>
                <div className="bg-gray-300"></div>
                <div className="bg-gray-200"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                {t('chooseLayout')}
              </div>
            </div>
            <div className="p-4">
              <p className="font-medium">2 x 2</p>
              <p className="text-sm text-gray-500">四格棋盘</p>
            </div>
          </div>
          
          {/* 示例拼图布局3 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-[4/3] relative">
              <div className="grid grid-cols-3 h-full">
                <div className="bg-gray-200"></div>
                <div className="bg-gray-300"></div>
                <div className="bg-gray-200"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                {t('chooseLayout')}
              </div>
            </div>
            <div className="p-4">
              <p className="font-medium">3 x 1</p>
              <p className="text-sm text-gray-500">三列式</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 