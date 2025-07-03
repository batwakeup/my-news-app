import React, { useState, useEffect, useCallback } from 'react';

// 主應用程式組件
const App = () => {
    const [newsArticles, setNewsArticles] = useState([]); // 儲存新聞文章的狀態
    const [loading, setLoading] = useState(false); // 載入狀態
    const [error, setError] = useState(null); // 錯誤訊息狀態
    const [topic, setTopic] = useState('科技'); // 新聞話題的狀態，預設為「科技」

    // 模擬從 Gemini API 獲取新聞的函數
   const fetchNews = useCallback(async () => {
        if (!topic.trim()) {
            setError("請輸入一個話題。");
            return;
        }

        setLoading(true); // 設定載入狀態為 true
        setError(null); // 清除之前的錯誤訊息
        try {
            // 構建向 Gemini API 發送的請求內容
            const chatHistory = [];
            const prompt = `請生成5條關於「${topic}」的當日新聞標題和簡要摘要。每條新聞應包含一個標題和一個簡短的摘要。請以JSON陣列格式返回，每個物件包含'title'和'summary'屬性。`;
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            // 設定生成配置，要求 JSON 格式的響應
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "title": { "type": "STRING" },
                                "summary": { "type": "STRING" }
                            },
                            "propertyOrdering": ["title", "summary"]
                        }
                    }
                }
            };

            const apiKey = ""; // API 金鑰，留空則由 Canvas 自動提供
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            // 發送請求到 Gemini API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            // 檢查 API 響應結構並解析新聞數據
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonString = result.candidates[0].content.parts[0].text;
                const parsedNews = JSON.parse(jsonString);
                setNewsArticles(parsedNews); // 更新新聞文章狀態
            } else {
                setError("無法獲取新聞。請稍後再試。"); // 設置錯誤訊息
                console.error("Gemini API 響應結構不符合預期:", result);
            }
        } catch (err) {
            setError("獲取新聞時發生錯誤：" + err.message); // 設置錯誤訊息
            console.error("獲取新聞時發生錯誤:", err);
        } finally {
            setLoading(false); // 設定載入狀態為 false
        }
    }, [topic]);

    // 複製新聞內容到剪貼簿
    const copyNewsToClipboard = () => {
        if (newsArticles.length === 0) {
            setError("沒有新聞可以複製。");
            return;
        }

        const newsText = newsArticles.map(article =>
            `標題: ${article.title}\n摘要: ${article.summary}\n`
        ).join('\n---\n'); // 使用 --- 分隔每條新聞

        // 使用 document.execCommand('copy') 複製內容，因為 navigator.clipboard.writeText 在 iframe 中可能受限
        const textArea = document.createElement('textarea');
        textArea.value = newsText;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('新聞內容已複製到剪貼簿！'); // 簡單的提示，您可以替換為更優雅的 UI 訊息
        } catch (err) {
            console.error('無法複製到剪貼簿:', err);
            alert('複製失敗，請手動複製。');
        }
        document.body.removeChild(textArea);
    };


    // 應用程式啟動時自動獲取新聞
    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
            {/* 標題 */}
            <h1 className="text-4xl font-bold text-gray-800 mb-8 mt-8 text-center">
                話題新聞整理
            </h1>

            {/* 話題輸入框 */}
            <div className="w-full max-w-2xl mb-4">
                <label htmlFor="topic-input" className="block text-gray-700 text-sm font-bold mb-2">
                    請輸入您感興趣的話題：
                </label>
                <input
                    type="text"
                    id="topic-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="例如：AI、環保、體育"
                    className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-300"
                />
            </div>

            {/* 獲取新聞按鈕 */}
            <button
                onClick={fetchNews}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 mb-4 focus:outline-none focus:ring-4 focus:ring-blue-300"
                disabled={loading} // 載入時禁用按鈕
            >
                {loading ? '載入中...' : '獲取話題新聞'}
            </button>

            {/* 複製新聞按鈕 */}
            <button
                onClick={copyNewsToClipboard}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 mb-8 focus:outline-none focus:ring-4 focus:ring-green-300"
                disabled={newsArticles.length === 0} // 沒有新聞時禁用按鈕
            >
                複製新聞內容
            </button>

            {/* 錯誤訊息顯示 */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4 w-full max-w-2xl text-center" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* 新聞文章列表 */}
            <div className="w-full max-w-2xl">
                {newsArticles.length > 0 ? (
                    newsArticles.map((article, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-md p-6 mb-6 transition duration-300 ease-in-out hover:shadow-lg">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                {article.title}
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                {article.summary}
                            </p>
                        </div>
                    ))
                ) : (
                    !loading && !error && (
                        <p className="text-gray-600 text-lg text-center">
                            目前沒有新聞可顯示。請輸入一個話題並點擊「獲取話題新聞」按鈕。
                        </p>
                    )
                )}
            </div>

            {/* 版權提示 */}
            <div className="mt-8 text-sm text-gray-500 text-center max-w-2xl">
                <p>
                    *請注意：本應用程式生成的新聞內容由 AI 模型輔助生成。AI 生成內容的版權歸屬是一個複雜的法律問題。
                    在發佈到自媒體時，建議註明內容為 AI 輔助生成，並確保不侵犯任何第三方權益。
                </p>
            </div>
        </div>
    );
};
export default App;