// 語氣對照表
const toneMap: Record<string, string> = {
    'normal': '標準',
    'casual': '口語化、親切、像在聊天',
    'formal': '非常正式、莊重、適合官方文件'
};

// 語氣程度對照表（用於調整）
const toneDescriptions: Record<number, string> = {
    1: '非常正式、莊重、適合官方文件',
    2: '稍微正式、專業但不失親和',
    3: '標準、中性的語氣',
    4: '稍微親切、溫暖、友善',
    5: '非常親切、口語化、像在聊天'
};

// 調整類型對照表
const adjustInstructions: Record<string, string> = {
    shorter: '請將評語精簡縮短約 30-50%，保留核心內容和重點，去除冗餘描述。',
    detailed: '請將評語增加更多細節和具體描述，擴展約 30-50%，使內容更加豐富完整。',
    rephrase: '請用不同的表達方式重新撰寫這段評語，保持相同的核心意思但使用不同的詞彙和句式。'
};

/**
 * 取得 Gemini API Key（從環境變數）
 */
const getApiKey = (): string => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('未設定 GEMINI_API_KEY 環境變數');
    }
    return apiKey;
};

/**
 * 呼叫 Gemini API 生成評語
 */
export const generateComment = async (
    name: string,
    traits: string,
    styles: string[],
    tone: string,
    wordCount: number
): Promise<string> => {
    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const styleInstructions = styles.length > 0
        ? styles.map(s => `風格【${s}】`).join('、')
        : '風格【質性描述】：以具體的行為或表現來描述學生的優缺點。';

    const tonePrompt = `語氣要求：${toneMap[tone] || '標準'}`;
    const lengthPrompt = `字數限制：每段評語約 ${wordCount || 80} 字左右。`;

    const prompt = `你是一位「台灣」的資深班導師。請根據以下學生的姓名與特質撰寫一段學期評語。

⚠️ **極其重要的語言要求（絕對不可違反）**：
- 你的輸出「必須」且「只能」使用「正體中文（繁體中文）」
- 「嚴禁」使用任何簡體字
- 請使用台灣慣用的繁體中文用語與詞彙

學生姓名：${name}
特質與觀察紀錄：${traits || '表現平穩'}

**額外條件設定：**
1. ${tonePrompt}
2. ${lengthPrompt}

請使用以下風格撰寫：
${styleInstructions}

**撰寫重點與限制：**
1. 請直接輸出評語，不要加標題或說明
2. **請勿使用 Markdown 格式**
3. 針對負面特質（若有），請用婉轉、建議或期許的方式表達
4. 所有文字必須是繁體中文
`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('API 額度已用完，請稍後再試');
        }
        if (response.status === 401 || response.status === 403) {
            throw new Error('API Key 無效或已過期');
        }
        throw new Error(`API 錯誤: ${response.status}`);
    }

    const data = await response.json() as {
        candidates?: Array<{
            content?: {
                parts?: Array<{ text?: string }>;
            };
        }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('評語生成失敗');
    }

    return text.trim();
};

/**
 * 呼叫 Gemini API 調整評語
 */
export const adjustComment = async (
    originalComment: string,
    adjustType: string,
    tone: number
): Promise<string> => {
    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `你是一位專業的文字編輯。請根據以下要求調整這段學期評語。

⚠️ **極其重要的語言要求（絕對不可違反）**：
- 你的輸出「必須」且「只能」使用「正體中文（繁體中文）」
- 「嚴禁」使用任何簡體字
- 請使用台灣慣用的繁體中文用語與詞彙

**原始評語：**
${originalComment}

**調整要求：**
${adjustInstructions[adjustType] || adjustInstructions.rephrase}

**語氣要求：**
${toneDescriptions[tone] || toneDescriptions[3]}

**輸出限制：**
1. 直接輸出調整後的評語，不要加任何標題或說明
2. 請勿使用 Markdown 格式
3. 保持評語的專業性和正面積極的態度
4. 所有文字必須是繁體中文
`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('API 額度已用完，請稍後再試');
        }
        throw new Error(`API 錯誤: ${response.status}`);
    }

    const data = await response.json() as {
        candidates?: Array<{
            content?: {
                parts?: Array<{ text?: string }>;
            };
        }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('評語調整失敗');
    }

    return text.trim();
};
