/**
 * The font picker's catalogue.
 *
 * Every webfont here is free for commercial use (SIL OFL or equivalent) and is
 * served by Google Fonts, which slices CJK families into ~100 unicode-range
 * subsets. That slicing is what makes "load on demand" meaningful: picking 霞鹜文楷
 * does not pull its ~5.7MB, only the ~50KB slices holding the characters actually
 * on the canvas.
 *
 * `google` is the css2 `family` parameter, verified to resolve — asking for a
 * weight a family does not ship makes the API return 400, so single-weight
 * families carry no weight axis.
 */
export interface FontOption {
  label: string // shown in the picker
  family: string // the CSS font-family value stored on elements
  google?: string // css2 family param; absent = installed on the OS, nothing to fetch
  group: string
}

export const FONTS: FontOption[] = [
  // ---- 中文 ----
  { label: '思源黑体', family: 'Noto Sans SC', google: 'Noto+Sans+SC:wght@400;500;600;700;900', group: '中文' },
  { label: '思源宋体', family: 'Noto Serif SC', google: 'Noto+Serif+SC:wght@400;500;600;700;900', group: '中文' },
  { label: '霞鹜文楷', family: 'LXGW WenKai TC', google: 'LXGW+WenKai+TC:wght@300;400;700', group: '中文' },
  { label: '站酷小薇', family: 'ZCOOL XiaoWei', google: 'ZCOOL+XiaoWei', group: '中文' },
  { label: '站酷黄油体', family: 'ZCOOL QingKe HuangYou', google: 'ZCOOL+QingKe+HuangYou', group: '中文' },
  { label: '站酷快乐体', family: 'ZCOOL KuaiLe', group: '中文', google: 'ZCOOL+KuaiLe' },

  // ---- 中文书法 ----
  { label: '马善政楷书', family: 'Ma Shan Zheng', google: 'Ma+Shan+Zheng', group: '书法' },
  { label: '志莽行书', family: 'Zhi Mang Xing', google: 'Zhi+Mang+Xing', group: '书法' },
  { label: '柳建毛草', family: 'Liu Jian Mao Cao', google: 'Liu+Jian+Mao+Cao', group: '书法' },
  { label: '龙藏体', family: 'Long Cang', google: 'Long+Cang', group: '书法' },

  // ---- 西文 ----
  { label: 'Inter', family: 'Inter', google: 'Inter:wght@400;500;600;700;900', group: '西文' },
  { label: 'Poppins', family: 'Poppins', google: 'Poppins:wght@400;600;800', group: '西文' },
  { label: 'Playfair Display', family: 'Playfair Display', google: 'Playfair+Display:wght@500;700;900', group: '西文' },
  { label: 'Bebas Neue', family: 'Bebas Neue', google: 'Bebas+Neue', group: '西文' },
  { label: 'Barlow Condensed', family: 'Barlow Condensed', google: 'Barlow+Condensed:wght@500;700', group: '西文' },
  { label: 'Pacifico', family: 'Pacifico', google: 'Pacifico', group: '西文' },
  { label: 'Roboto Mono', family: 'Roboto Mono', google: 'Roboto+Mono:wght@400;700', group: '西文' },

  // ---- 系统字体，无需加载 ----
  { label: 'Georgia', family: 'Georgia', group: '系统' },
  { label: 'Times New Roman', family: 'Times New Roman', group: '系统' },
  { label: 'Arial', family: 'Arial', group: '系统' },
  { label: 'Courier New', family: 'Courier New', group: '系统' },
  { label: 'Impact', family: 'Impact', group: '系统' },
]

export const FONT_GROUPS = [...new Set(FONTS.map((f) => f.group))]
export const findFont = (family?: string) => FONTS.find((f) => f.family === family)
