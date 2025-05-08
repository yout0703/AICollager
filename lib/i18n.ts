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
    chooseAspectRatio: "Choose an aspect ratio",
    chooseLayout: "Choose a layout",
    dragImages: "Drag your images here",
    adjustPosition: "Adjust image positions",
    previewArea: "Preview Area",
    beautyMode: "Beauty Mode",
    exactMode: "Exact Mode",
    exactModeDescription: "Exact mode shows precisely how images will appear in downloaded result",
    shapeLayouts: "Shape Layouts",
    shapeMasks: "Shape Masks",
    switchToBeautyMode: "Switch to Beauty Mode",
    switchToExactMode: "Switch to Exact Mode",
    aspectRatioInfo: "The image will keep its aspect ratio and be centered",
    exactModeInfo: "The image shows exactly as it will be downloaded",
    imageControls: "Image Controls",
    scale: "Scale",
    keepRatio: "Keep Ratio",
    rotate: "Rotate",
    resetTransform: "Reset",
    clickImageToEditInfo: "Click an image to edit its appearance",
    users: "Users",
    rating: "Rating",
    collages: "Collages",
    uploadedImages: "Uploaded Images",
    dragOrClickInstructions: "Drag to canvas or click to add",
    pleaseUploadImages: "Please upload some images",
    uploadedImage: "Uploaded image",
    addToPreview: "Add to preview",
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
    chooseAspectRatio: "选择尺寸比例",
    chooseLayout: "选择布局",
    dragImages: "拖拽您的图片到这里",
    adjustPosition: "调整图片位置",
    previewArea: "预览区",
    beautyMode: "美观模式",
    exactMode: "精确模式",
    exactModeDescription: "精确模式显示图片在下载后的精确效果",
    shapeLayouts: "形状布局",
    shapeMasks: "形状蒙版",
    switchToBeautyMode: "切换到美观模式",
    switchToExactMode: "切换到精确模式",
    aspectRatioInfo: "图片将保持原比例并居中显示",
    exactModeInfo: "图片显示效果与下载后完全一致",
    imageControls: "图像控制",
    scale: "缩放",
    keepRatio: "保持比例",
    rotate: "旋转",
    resetTransform: "重置",
    clickImageToEditInfo: "点击图像以编辑其外观",
    users: "用户数",
    rating: "评分",
    collages: "拼图作品",
    uploadedImages: "已上传图片",
    dragOrClickInstructions: "拖拽到画布或点击添加",
    pleaseUploadImages: "请上传一些图片",
    uploadedImage: "已上传图片",
    addToPreview: "添加到预览",
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
    chooseAspectRatio: "Elige una relación de aspecto",
    chooseLayout: "Elige un diseño",
    dragImages: "Arrastra tus imágenes aquí",
    adjustPosition: "Ajusta la posición de las imágenes",
    previewArea: "Área de vista previa",
    beautyMode: "Modo Estético",
    exactMode: "Modo Exacto",
    exactModeDescription: "El modo exacto muestra precisamente cómo aparecerán las imágenes en el resultado descargado",
    shapeLayouts: "Diseños de Forma",
    shapeMasks: "Máscaras de Forma",
    switchToBeautyMode: "Cambiar a Modo Estético",
    switchToExactMode: "Cambiar a Modo Exacto",
    aspectRatioInfo: "La imagen mantendrá su relación de aspecto y estará centrada",
    exactModeInfo: "La imagen se muestra exactamente como se descargará",
    imageControls: "Controles de Imagen",
    scale: "Escala",
    keepRatio: "Mantener Proporción",
    rotate: "Rotar",
    resetTransform: "Reiniciar",
    clickImageToEditInfo: "Haga clic en una imagen para editar su apariencia",
    users: "Usuarios",
    rating: "Calificación",
    collages: "Collages",
    uploadedImages: "Imágenes subidas",
    dragOrClickInstructions: "Arrastra al lienzo o haz clic para añadir",
    pleaseUploadImages: "Por favor, sube algunas imágenes",
    uploadedImage: "Imagen subida",
    addToPreview: "Añadir a vista previa",
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
    previewArea: "Zone d'aperçu",
    beautyMode: "Mode Esthétique",
    exactMode: "Mode Exact",
    exactModeDescription: "Le mode exact montre précisément comment les images apparaîtront dans le résultat téléchargé",
    shapeLayouts: "Mises en Page de Forme",
    shapeMasks: "Masques de Forme",
    switchToBeautyMode: "Passer au Mode Esthétique",
    switchToExactMode: "Passer au Mode Exact",
    aspectRatioInfo: "L'image conservera son rapport d'aspect et sera centrée",
    exactModeInfo: "L'image s'affiche exactement comme elle sera téléchargée",
    imageControls: "Contrôles d'Image",
    scale: "Échelle",
    keepRatio: "Conserver les Proportions",
    rotate: "Pivoter",
    resetTransform: "Réinitialiser",
    clickImageToEditInfo: "Cliquez sur une image pour modifier son apparence",
    users: "Utilisateurs",
    rating: "Évaluation",
    collages: "Collages",
    uploadedImages: "Images téléchargées",
    dragOrClickInstructions: "Glissez sur le canevas ou cliquez pour ajouter",
    pleaseUploadImages: "Veuillez télécharger des images",
    uploadedImage: "Image téléchargée",
    addToPreview: "Ajouter à l'aperçu",
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
    previewArea: "Vorschaubereich",
    beautyMode: "Schönheitsmodus",
    exactMode: "Genauer Modus",
    exactModeDescription: "Der genaue Modus zeigt exakt, wie die Bilder im heruntergeladenen Ergebnis erscheinen werden",
    shapeLayouts: "Form-Layouts",
    shapeMasks: "Form-Masken",
    switchToBeautyMode: "Zum Schönheitsmodus wechseln",
    switchToExactMode: "Zum genauen Modus wechseln",
    aspectRatioInfo: "Das Bild behält sein Seitenverhältnis bei und wird zentriert",
    exactModeInfo: "Das Bild wird genau so angezeigt, wie es heruntergeladen wird",
    imageControls: "Bildsteuerung",
    scale: "Skalierung",
    keepRatio: "Proportionen beibehalten",
    rotate: "Drehen",
    resetTransform: "Zurücksetzen",
    clickImageToEditInfo: "Klicken Sie auf ein Bild, um sein Aussehen zu bearbeiten",
    users: "Benutzer",
    rating: "Bewertung",
    collages: "Collagen",
    uploadedImages: "Hochgeladene Bilder",
    dragOrClickInstructions: "Auf Leinwand ziehen oder klicken zum Hinzufügen",
    pleaseUploadImages: "Bitte laden Sie einige Bilder hoch",
    uploadedImage: "Hochgeladenes Bild",
    addToPreview: "Zur Vorschau hinzufügen",
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
    previewArea: "プレビューエリア",
    beautyMode: "美しさモード",
    exactMode: "正確モード",
    exactModeDescription: "正確モードはダウンロードされた結果でどのように画像が表示されるかを正確に示します",
    shapeLayouts: "形状レイアウト",
    shapeMasks: "形状マスク",
    switchToBeautyMode: "美しさモードに切り替え",
    switchToExactMode: "正確モードに切り替え",
    aspectRatioInfo: "画像はアスペクト比を保ちながら中央に配置されます",
    exactModeInfo: "画像はダウンロード時と全く同じように表示されます",
    imageControls: "画像コントロール",
    scale: "拡大縮小",
    keepRatio: "縦横比を維持",
    rotate: "回転",
    resetTransform: "リセット",
    clickImageToEditInfo: "画像をクリックして外観を編集",
    users: "ユーザー数",
    rating: "レーティング",
    collages: "コラージュ作品",
    uploadedImages: "アップロード済み画像",
    dragOrClickInstructions: "キャンバスにドラッグまたはクリックして追加",
    pleaseUploadImages: "画像をアップロードしてください",
    uploadedImage: "アップロード済み画像",
    addToPreview: "プレビューに追加",
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
    previewArea: "미리보기 영역",
    beautyMode: "아름다움 모드",
    exactMode: "정확한 모드",
    exactModeDescription: "정확한 모드는 다운로드된 결과에서 이미지가 어떻게 표시될지 정확히 보여줍니다",
    shapeLayouts: "모양 레이아웃",
    shapeMasks: "모양 마스크",
    switchToBeautyMode: "아름다움 모드로 전환",
    switchToExactMode: "정확한 모드로 전환",
    aspectRatioInfo: "이미지는 종횡비를 유지하며 중앙에 배치됩니다",
    exactModeInfo: "이미지는 다운로드될 때와 정확히 동일하게 표시됩니다",
    imageControls: "이미지 컨트롤",
    scale: "크기 조정",
    keepRatio: "비율 유지",
    rotate: "회전",
    resetTransform: "초기화",
    clickImageToEditInfo: "이미지를 클릭하여 모양 편집",
    users: "유저수",
    rating: "평점",
    collages: "콜라주 작품",
    uploadedImages: "업로드된 이미지",
    dragOrClickInstructions: "캔버스에 드래그하거나 클릭하여 추가",
    pleaseUploadImages: "이미지를 업로드해주세요",
    uploadedImage: "업로드된 이미지",
    addToPreview: "미리보기에 추가",
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