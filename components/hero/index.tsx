import Link from "next/link";
import { Dictionary } from "@/lib/i18n";

interface HeroProps {
  dict: Dictionary;
  locale: string;
  t: (key: string) => string;
}

export default function Hero({ t, locale }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] py-16 px-6 flex flex-col justify-center items-center overflow-hidden">
      {/* 背景线条装饰 */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute w-full h-full">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute w-full h-[1px] bg-border" style={{ top: `${i * 8}%` }}></div>
          ))}
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute h-full w-[1px] bg-border" style={{ left: `${i * 8}%` }}></div>
          ))}
        </div>
      </div>
      
      {/* 彩色装饰元素 */}
      <div className="absolute top-10 right-10 w-16 h-16 bg-pink-200 rounded-full mix-blend-multiply opacity-60 animate-blob"></div>
      <div className="absolute bottom-20 left-10 w-10 h-10 bg-purple-200 rounded-full mix-blend-multiply opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute top-[30%] left-[10%] w-6 h-6 text-primary opacity-70 animate-blob animation-delay-4000">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
        </svg>
      </div>
      
      {/* 主内容容器 - 确保在背景之上 */}
      <div className="container mx-auto max-w-5xl z-10 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
          {t('appName')}
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-light mt-8 mb-6 text-muted-foreground max-w-2xl mx-auto">
          {t('tagline')}
        </h2>
        
        <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
          {t('description')}
        </p>
        
        <div className="flex justify-center">
          <Link
            href={`/${locale}/collage`}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-10 py-4 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            {t('collageButton')}
          </Link>
        </div>
        
        {/* 数据展示部分 */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-24 text-center">
          <div className="flex flex-col">
            <div className="text-3xl md:text-4xl font-bold text-foreground">50K+</div>
            <div className="text-sm text-muted-foreground">{t('users')}</div>
          </div>
          <div className="flex flex-col">
            <div className="text-3xl md:text-4xl font-bold text-foreground">5.0</div>
            <div className="text-sm text-muted-foreground">{t('rating')}</div>
          </div>
          <div className="flex flex-col">
            <div className="text-3xl md:text-4xl font-bold text-foreground">300M+</div>
            <div className="text-sm text-muted-foreground">{t('collages')}</div>
          </div>
        </div>
      </div>
      
      {/* 底部波浪 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-0">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="relative block w-full h-full">
          <path 
            d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,208C840,213,960,203,1080,181.3C1200,160,1320,128,1380,112L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" 
            fill="hsl(var(--background))"
          ></path>
        </svg>
      </div>
    </section>
  );
}
