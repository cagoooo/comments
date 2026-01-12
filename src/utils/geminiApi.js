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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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

    const prompt = `你是一位資深的班導師。請根據以下學生的姓名與特質，針對指定的每一種風格，"分別"撰寫一段學期評語。

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
6. 輸出格式請清晰分隔，例如：
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

export default callGeminiAPI;
