import { STYLE_DEFINITIONS } from '../data/styleDefinitions';

/**
 * 取得儲存的 API Key
 * @returns {string} API Key
 */
export const getApiKey = () => {
    return localStorage.getItem('gemini_api_key') || '';
};

/**
 * 檢查是否已設定 API Key
 * @returns {boolean}
 */
export const hasApiKey = () => {
    return !!getApiKey();
};

/**
 * 呼叫 Gemini API 產生評語
 * @param {string} name - 學生姓名
 * @param {string} combinedTraits - 合併的特質字串
 * @param {string[]} styles - 選擇的風格 ID 陣列
 * @param {object} extraSettings - 額外設定（語氣、字數）
 * @returns {Promise<string>} - 產生的評語
 */
export const callGeminiAPI = async (name, combinedTraits, styles = [], extraSettings) => {
    const apiKey = getApiKey();

    if (!apiKey) {
        return "❌ 尚未設定 API Key，請先點擊頁首的「⚙️」按鈕設定您的 Gemini API Key。";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let styleInstructions = "";
    if (styles.length > 0) {
        styleInstructions = styles.map(sId => {
            const def = STYLE_DEFINITIONS.find(d => d.id === sId);
            return def ? `風格【${def.name}】：${def.desc}` : "";
        }).join("\n");
    } else {
        styleInstructions = "風格【質性描述】：以具體的行為或表現來描述學生的優缺點。";
    }

    const toneMap = {
        'normal': '標準',
        'casual': '口語化、親切、像在聊天',
        'formal': '非常正式、莊重、適合官方文件'
    };
    const tonePrompt = `語氣要求：${toneMap[extraSettings.tone] || '標準'}`;
    const lengthPrompt = `字數限制：每段評語約 ${extraSettings.wordCount || 80} 字左右。`;

    const prompt = `你是一位「台灣」的資深班導師。請根據以下學生的姓名與特質，針對指定的每一種風格，"分別"撰寫一段學期評語。

⚠️ **極其重要的語言要求（絕對不可違反）**：
- 你的輸出「必須」且「只能」使用「正體中文（繁體中文）」
- 「嚴禁」使用任何簡體字（如：学、进、这、发、时、为、头、对、开、关、与、专、业、应、变、实、认、设、让、话、说、东、车、钟、网、视、没、级、师、习等）
- 請使用台灣慣用的繁體中文用語與詞彙
- 如果你發現輸出中有任何簡體字，請自動轉換為對應的繁體字

學生姓名：${name}
特質與觀察紀錄：${combinedTraits || "表現平穩"}

**額外條件設定：**
1. ${tonePrompt}
2. ${lengthPrompt}

請針對以下 ${styles.length || 1} 種風格逐一撰寫（請勿融合，需分開列出）：
${styleInstructions}

**撰寫重點與限制：**
1. 每種風格請獨立產出一對應的評語。
2. 請融合「特質」與「觀察紀錄」進行描述。
3. **請勿使用 Markdown 格式**（不要使用 **粗體**、*斜體*、# 標題等符號）。
4. **提到特質詞彙時，請勿使用「」或引號包裹**，請直接將特質自然融入語句中。
5. 針對負面特質（若有），請用婉轉、建議或期許的方式表達。
6. **再次強調：所有文字必須是繁體中文（正體中文），絕對禁止出現任何簡體字！**
7. 輸出格式請清晰分隔，例如：
【風格名稱】
評語內容...
(空行)
【風格名稱】
評語內容...
`;

    let retries = 0;
    const maxRetries = 5;
    const backoff = [1000, 2000, 4000, 8000, 16000];

    while (retries <= maxRetries) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                // API Key 無效
                if (response.status === 400 || response.status === 401 || response.status === 403) {
                    return "❌ API Key 無效或已過期，請重新設定。";
                }
                // 配額用完
                if (response.status === 429) {
                    const errorData = await response.json().catch(() => ({}));
                    const retryDelay = errorData?.error?.details?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay;

                    if (retryDelay && retries < maxRetries) {
                        // 有建議重試時間，等待後重試
                        const delayMs = parseInt(retryDelay) * 1000 || backoff[retries];
                        await new Promise(r => setTimeout(r, Math.min(delayMs, 10000)));
                        retries++;
                        continue;
                    }

                    return "❌ API 免費額度已用完，請明天再試或建立新的 API Key。";
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return text || "評語生成失敗，請稍後再試。";
        } catch (error) {
            if (retries === maxRetries) {
                console.error("Gemini API Failed:", error);
                return "❌ 生成連線逾時，請檢查網路或稍後再試。";
            }
            await new Promise(r => setTimeout(r, backoff[retries]));
            retries++;
        }
    }
};

/**
 * 調整評語（縮短、增加細節、換種說法）
 * @param {string} originalComment - 原始評語
 * @param {string} adjustType - 調整類型：'shorter' | 'detailed' | 'rephrase'
 * @param {number} tone - 語氣程度：1(正式) - 5(親切)
 * @returns {Promise<string>} - 調整後的評語
 */
export const adjustComment = async (originalComment, adjustType, tone = 3) => {
    const apiKey = getApiKey();

    if (!apiKey) {
        return "❌ 尚未設定 API Key，請先設定後再試。";
    }

    if (!originalComment || originalComment.includes('❌')) {
        return "❌ 無法調整此評語。";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 語氣對照表
    const toneDescriptions = {
        1: '非常正式、莊重、適合官方文件',
        2: '稍微正式、專業但不失親和',
        3: '標準、中性的語氣',
        4: '稍微親切、溫暖、友善',
        5: '非常親切、口語化、像在聊天'
    };

    // 調整類型對照表
    const adjustInstructions = {
        shorter: '請將評語精簡縮短約 30-50%，保留核心內容和重點，去除冗餘描述。',
        detailed: '請將評語增加更多細節和具體描述，擴展約 30-50%，使內容更加豐富完整。',
        rephrase: '請用不同的表達方式重新撰寫這段評語，保持相同的核心意思但使用不同的詞彙和句式。'
    };

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

    let retries = 0;
    const maxRetries = 3;
    const backoff = [1000, 2000, 4000];

    while (retries <= maxRetries) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                if (response.status === 400 || response.status === 401 || response.status === 403) {
                    return "❌ API Key 無效或已過期，請重新設定。";
                }
                if (response.status === 429) {
                    return "❌ API 額度已用完，請稍後再試。";
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return text?.trim() || "❌ 調整失敗，請稍後再試。";
        } catch (error) {
            if (retries === maxRetries) {
                console.error("Gemini API Adjust Failed:", error);
                return "❌ 連線逾時，請檢查網路或稍後再試。";
            }
            await new Promise(r => setTimeout(r, backoff[retries]));
            retries++;
        }
    }
};

export default callGeminiAPI;

