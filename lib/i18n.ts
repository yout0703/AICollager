import { locales, defaultLocale } from "./config";

export type Locale = (typeof locales)[number];

// 语言字典类型，支持字符串、对象和数组
export type Dictionary = {
  [key: string]: string | Dictionary | string[];
};

// 获取嵌套属性的类型帮助函数
type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & (string | number)];

// 语言字典
export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    appName: "AICollager",
    tagline: "Create beautiful photo collages with AI",
    description: "Use AI technology to create beautiful photo collages and design works",
    uploadButton: "Upload Images",
    collageButton: "Create Collage",
    downloadButton: "Download",
    loginRequired: "Login required to download",
    chooseLayout: "Choose a layout",
    dragImages: "Drag your images here",
    adjustPosition: "Adjust image positions",
    users: "Users",
    rating: "Rating",
    collages: "Collages",
    pricing: {
      title: "Pricing",
      free: {
        title: "Free",
        description: "Download 1 collage",
        price: "Free",
        features: ["Basic layouts", "Download 1 collage"]
      },
      basic: {
        title: "Basic",
        description: "Download 100 collages",
        price: "$9.9/month",
        features: ["Download 100 collages", "AI layout", "Add text", "Priority support"]
      },
      pro: {
        title: "Pro",
        description: "Download 2000 collages",
        price: "$99/month",
        features: ["Download 2000 collages", "AI layout", "Add text", "Custom image editing", "Dedicated support"]
      }
    },
    nav: {
      home: "Home",
      pricing: "Pricing",
      dashboard: "Dashboard",
      login: "Login",
      signUp: "Sign Up"
    }
  },
  zh: {
    appName: "AI拼图大师",
    tagline: "用AI创建精美照片拼图",
    description: "使用AI技术创建精美的图像拼贴和设计作品",
    uploadButton: "上传图片",
    collageButton: "创建拼图",
    downloadButton: "下载",
    loginRequired: "需要登录才能下载",
    chooseLayout: "选择布局",
    dragImages: "拖拽您的图片到这里",
    adjustPosition: "调整图片位置",
    users: "用户数",
    rating: "评分",
    collages: "拼图作品",
    pricing: {
      title: "价格",
      free: {
        title: "免费版",
        description: "下载1张拼图",
        price: "免费",
        features: ["基础布局", "下载1张拼图"]
      },
      basic: {
        title: "基础版",
        description: "下载100张拼图",
        price: "¥9.9/月",
        features: ["下载100张拼图", "AI布局", "添加文字", "优先支持"]
      },
      pro: {
        title: "专业版",
        description: "下载2000张拼图",
        price: "¥99/月",
        features: ["下载2000张拼图", "AI布局", "添加文字", "自定义图片编辑", "专属支持"]
      }
    },
    nav: {
      home: "首页",
      pricing: "价格",
      dashboard: "控制台",
      login: "登录",
      signUp: "注册"
    }
  },
  es: {
    appName: "AICollager",
    tagline: "Crea hermosos collages de fotos con IA",
    description: "Utiliza la tecnología de IA para crear hermosos collages de imágenes y trabajos de diseño",
    uploadButton: "Subir Imágenes",
    collageButton: "Crear Collage",
    downloadButton: "Descargar",
    loginRequired: "Se requiere iniciar sesión para descargar",
    chooseLayout: "Elige un diseño",
    dragImages: "Arrastra tus imágenes aquí",
    adjustPosition: "Ajusta la posición de las imágenes",
    users: "Usuarios",
    rating: "Calificación",
    collages: "Collages",
    pricing: {
      title: "Precios",
      free: {
        title: "Gratis",
        description: "Descarga 1 collage",
        price: "Gratis",
        features: ["Diseños básicos", "Descarga 1 collage"]
      },
      basic: {
        title: "Básico",
        description: "Descarga 100 collages",
        price: "$9.9/mes",
        features: ["Descarga 100 collages", "Diseño con IA", "Añadir texto", "Soporte prioritario"]
      },
      pro: {
        title: "Pro",
        description: "Descarga 2000 collages",
        price: "$99/mes",
        features: ["Descarga 2000 collages", "Diseño con IA", "Añadir texto", "Edición de imágenes personalizada", "Soporte dedicado"]
      }
    },
    nav: {
      home: "Inicio",
      pricing: "Precios",
      dashboard: "Panel",
      login: "Iniciar Sesión",
      signUp: "Registrarse"
    }
  },
  fr: {
    appName: "AICollager",
    tagline: "Créez de beaux collages photo avec l'IA",
    description: "Utilisez la technologie IA pour créer de beaux collages d'images et des œuvres de design",
    uploadButton: "Télécharger des images",
    collageButton: "Créer un collage",
    downloadButton: "Télécharger",
    loginRequired: "Connexion requise pour télécharger",
    chooseLayout: "Choisissez une mise en page",
    dragImages: "Faites glisser vos images ici",
    adjustPosition: "Ajuster la position des images",
    users: "Utilisateurs",
    rating: "Évaluation",
    collages: "Collages",
    pricing: {
      title: "Tarifs",
      free: {
        title: "Gratuit",
        description: "Téléchargez 1 collage",
        price: "Gratuit",
        features: ["Mises en page de base", "Téléchargez 1 collage"]
      },
      basic: {
        title: "Basique",
        description: "Téléchargez 100 collages",
        price: "9,9€/mois",
        features: ["Téléchargez 100 collages", "Mise en page IA", "Ajouter du texte", "Support prioritaire"]
      },
      pro: {
        title: "Pro",
        description: "Téléchargez 2000 collages",
        price: "99€/mois",
        features: ["Téléchargez 2000 collages", "Mise en page IA", "Ajouter du texte", "Édition d'image personnalisée", "Support dédié"]
      }
    },
    nav: {
      home: "Accueil",
      pricing: "Tarifs",
      dashboard: "Tableau de bord",
      login: "Connexion",
      signUp: "S'inscrire"
    }
  },
  de: {
    appName: "AICollager",
    tagline: "Erstellen Sie schöne Fotocollagen mit KI",
    description: "Verwenden Sie KI-Technologie, um schöne Bildcollagen und Designarbeiten zu erstellen",
    uploadButton: "Bilder hochladen",
    collageButton: "Collage erstellen",
    downloadButton: "Herunterladen",
    loginRequired: "Anmeldung erforderlich zum Herunterladen",
    chooseLayout: "Wählen Sie ein Layout",
    dragImages: "Ziehen Sie Ihre Bilder hierher",
    adjustPosition: "Bildpositionen anpassen",
    users: "Benutzer",
    rating: "Bewertung",
    collages: "Collagen",
    pricing: {
      title: "Preise",
      free: {
        title: "Kostenlos",
        description: "1 Collage herunterladen",
        price: "Kostenlos",
        features: ["Grundlegende Layouts", "1 Collage herunterladen"]
      },
      basic: {
        title: "Basic",
        description: "100 Collagen herunterladen",
        price: "9,9€/Monat",
        features: ["100 Collagen herunterladen", "KI-Layout", "Text hinzufügen", "Vorrangiger Support"]
      },
      pro: {
        title: "Pro",
        description: "2000 Collagen herunterladen",
        price: "99€/Monat",
        features: ["2000 Collagen herunterladen", "KI-Layout", "Text hinzufügen", "Benutzerdefinierte Bildbearbeitung", "Dedizierter Support"]
      }
    },
    nav: {
      home: "Startseite",
      pricing: "Preise",
      dashboard: "Dashboard",
      login: "Anmelden",
      signUp: "Registrieren"
    }
  },
  ja: {
    appName: "AICollager",
    tagline: "AIで美しい写真コラージュを作成",
    description: "AI技術を使用して美しい画像コラージュとデザイン作品を作成",
    uploadButton: "画像をアップロード",
    collageButton: "コラージュを作成",
    downloadButton: "ダウンロード",
    loginRequired: "ダウンロードにはログインが必要です",
    chooseLayout: "レイアウトを選択",
    dragImages: "ここに画像をドラッグ",
    adjustPosition: "画像の位置を調整",
    users: "ユーザー数",
    rating: "レーティング",
    collages: "コラージュ作品",
    pricing: {
      title: "料金",
      free: {
        title: "無料",
        description: "1枚のコラージュをダウンロード",
        price: "無料",
        features: ["基本レイアウト", "1枚のコラージュをダウンロード"]
      },
      basic: {
        title: "ベーシック",
        description: "100枚のコラージュをダウンロード",
        price: "¥990/月",
        features: ["100枚のコラージュをダウンロード", "AIレイアウト", "テキスト追加", "優先サポート"]
      },
      pro: {
        title: "プロ",
        description: "2000枚のコラージュをダウンロード",
        price: "¥9,900/月",
        features: ["2000枚のコラージュをダウンロード", "AIレイアウト", "テキスト追加", "カスタム画像編集", "専任サポート"]
      }
    },
    nav: {
      home: "ホーム",
      pricing: "料金",
      dashboard: "ダッシュボード",
      login: "ログイン",
      signUp: "登録"
    }
  },
  ko: {
    appName: "AICollager",
    tagline: "AI로 아름다운 사진 콜라주 만들기",
    description: "AI 기술을 사용하여 아름다운 이미지 콜라주 및 디자인 작품 만들기",
    uploadButton: "이미지 업로드",
    collageButton: "콜라주 만들기",
    downloadButton: "다운로드",
    loginRequired: "다운로드하려면 로그인이 필요합니다",
    chooseLayout: "레이아웃 선택",
    dragImages: "이미지를 여기에 끌어다 놓으세요",
    adjustPosition: "이미지 위치 조정",
    users: "유저수",
    rating: "평점",
    collages: "콜라주 작품",
    pricing: {
      title: "가격",
      free: {
        title: "무료",
        description: "1개 콜라주 다운로드",
        price: "무료",
        features: ["기본 레이아웃", "1개 콜라주 다운로드"]
      },
      basic: {
        title: "기본",
        description: "100개 콜라주 다운로드",
        price: "₩9,900/월",
        features: ["100개 콜라주 다운로드", "AI 레이아웃", "텍스트 추가", "우선 지원"]
      },
      pro: {
        title: "프로",
        description: "2000개 콜라주 다운로드",
        price: "₩99,000/월",
        features: ["2000개 콜라주 다운로드", "AI 레이아웃", "텍스트 추가", "맞춤 이미지 편집", "전담 지원"]
      }
    },
    nav: {
      home: "홈",
      pricing: "가격",
      dashboard: "대시보드",
      login: "로그인",
      signUp: "가입하기"
    }
  }
};

// 获取指定语言的字典
export const getDictionary = (locale: Locale) => {
  return dictionaries[locale];
};

// 获取指定语言的嵌套属性
export const getTranslation = (dict: Dictionary, key: string): string => {
  const keys = key.split('.');
  let value: any = dict;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // 如果找不到翻译，返回原始 key
    }
  }

  return typeof value === 'string' ? value : key;
}; 