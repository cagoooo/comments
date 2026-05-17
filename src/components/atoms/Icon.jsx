import React from 'react';
import {
    Plus, Trash2, RefreshCw, Search, Filter,
    Sparkles, Sparkle, Settings, Heart, FileSpreadsheet,
    Printer, BarChart3, Shield,
    ChevronDown, ChevronRight, ChevronLeft, Menu,
    School, Hash, Palette, Pencil, Clock, Star,
    Download, Upload, File, Check, X, Tag,
    BookOpen, User, Bell, ArrowRight, ArrowLeft,
    Maximize2, Minimize2, Info, Zap, List,
} from 'lucide-react';

/**
 * 點石成金蜂 icon set — proto 名稱 → lucide-react 對照表。
 *
 * 兩種用法：
 *  1. 字串 name（向後相容 proto/icons.jsx）：
 *     `<Icon name="spark" />`
 *  2. 直接 import lucide-react 的元件（推薦給新程式碼）：
 *     `import { Sparkles } from 'lucide-react';  <Sparkles size={18} strokeWidth={1.8} />`
 *
 * 統一預設值：strokeWidth = 1.8, size = 18（依 HANDOFF §Batch 3）。
 */
const ICON_MAP = {
    plus: Plus,
    trash: Trash2,
    refresh: RefreshCw,
    search: Search,
    filter: Filter,
    spark: Sparkles,
    sparkle: Sparkle,
    settings: Settings,
    heart: Heart,
    excel: FileSpreadsheet,
    print: Printer,
    chart: BarChart3,
    shield: Shield,
    chev: ChevronDown,
    chevR: ChevronRight,
    chevL: ChevronLeft,
    menu: Menu,
    school: School,
    hash: Hash,
    palette: Palette,
    edit: Pencil,
    clock: Clock,
    star: Star,
    download: Download,
    upload: Upload,
    file: File,
    check: Check,
    x: X,
    tag: Tag,
    book: BookOpen,
    user: User,
    bell: Bell,
    arrowR: ArrowRight,
    arrowL: ArrowLeft,
    expand: Maximize2,
    minimize: Minimize2,
    info: Info,
    lightning: Zap,
    list: List,
};

/**
 * @param {Object} props
 * @param {string} props.name - 對照表中的 key（必填）
 * @param {number} [props.size=18]
 * @param {number} [props.strokeWidth=1.8]
 * @param {string} [props.className]
 * @param {string} [props.color] - 預設 currentColor
 */
const Icon = ({ name, size = 18, strokeWidth = 1.8, className = '', color, ...rest }) => {
    const Component = ICON_MAP[name];
    if (!Component) {
        if (typeof console !== 'undefined') {
            console.warn(`[Icon] Unknown icon name: "${name}". See src/components/atoms/Icon.jsx for available names.`);
        }
        return null;
    }
    return (
        <Component
            size={size}
            strokeWidth={strokeWidth}
            className={className}
            color={color}
            aria-hidden="true"
            {...rest}
        />
    );
};

export default Icon;
export { ICON_MAP };
