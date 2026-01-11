/**
 * 評語生成風格定義
 * 定義 AI 產生評語時可選用的不同寫作風格
 */
export const STYLE_DEFINITIONS = [
    { id: 'qualitative', name: '質性描述', desc: '以具體的行為或表現來描述學生的優缺點。' },
    { id: 'emotional', name: '感性關懷', desc: '從情感出發表達對學生的關注與支持。' },
    { id: 'friendly', name: '友善提醒', desc: '用溫和的語氣提醒學生需要注意或改進的地方。' },
    { id: 'humorous', name: '風趣幽默', desc: '用幽默的方式拉近與學生的距離。' },
    { id: 'internal', name: '內在驅動', desc: '激勵學生發掘自身潛力。' },
    { id: 'philosophical', name: '哲理啟發', desc: '通過富含哲理的語句啟發學生。' },
    { id: 'practical', name: '實用指導', desc: '提供明確且實際的建議。' },
    { id: 'resonance', name: '情感共鳴', desc: '用真摯的語氣拉近心理距離。' },
    { id: 'blessing', name: '暖心祝福', desc: '傳達真誠的祝福。' },
    { id: 'scenario', name: '情境劇描述', desc: '透過情景設定或故事描述。' },
    { id: 'milestone', name: '目標里程碑', desc: '點明學生完成的目標並設定新的挑戰。' },
    { id: 'journey', name: '心靈旅程', desc: '將學生的成長比喻為旅程。' }
];

export default STYLE_DEFINITIONS;
