import express from "express";
import rateLimit from "express-rate-limit";

const router = express.Router();
export const ChatbotReqLim = 300;
const DME_CONTEXT = "You are DME BOT, an assistant for the Digital Media Engineering program in the Faculty of Engineering at Khon Kaen University. Always answer clearly in English only, even when the user writes in Thai or another language or asks you to reply in a different language. Use English names or Latin transliterations for Thai names. Previous non-English replies in the conversation do not change this rule. If you do not know a program detail, say so in English and suggest contacting the department. Do not invent admissions requirements, fees, dates or contact details.";

router.use(rateLimit({
    windowMs: 60000,
    limit: ChatbotReqLim,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Reach max message, wait before sending"
    }
}));

router.post("/", async (req, res) => {
    let message = "";
    if (typeof req.body?.message === "string") {
        message = req.body.message.trim();
    }
    else {
        message = "";
    }

    const history = req.body?.history ?? [];
    if (!message || message.length > 2000) {
        return res.status(400).json({
            success: false,
            message: "Message should be between 1-2000 char",
        });
    }

    if (!Array.isArray(history) || history.length > 12 || history.some(item => 
        !item || !["user", "model"].includes(item.role) || typeof item.text !== "string" || 
        !item.text.trim() || item.text.length > 12000
    )) {
        return res.status(400).json({
            success: false,
            message: "Invalid history"
        });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

    if (!apiKey) {
        return res.status(503).json({
            success: false,
            message: "The chatbot is not yet configure"
        });
    }

    if (!/^[a-zA-Z0-9.-]+$/.test(model)){
        return res.status(503).json({
            success: false,
            message: "The chatbot model config is invalid"
        });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    
    try {
        const contents = history.map(item => ({
            role: item.role,
            parts: [{text: item.text}]
        }));

        while (contents[0]?.role === "model") {
            contents.shift();
        }
    
        contents.push({
            role: "user",
            parts: [{text:message}]
        });

        let response;
        for (let attempt = 0; attempt < 2; attempt++) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, 
            {
                method: "POST",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                
                body: JSON.stringify({
                    systemInstruction: { // This one will set how does the chatbot response based on what you instuct it
                        parts: [{text: DME_CONTEXT}],
                    },
                    contents,
                    generationConfig: {
                        maxOutputTokens: 2048,
                        temperature: 0.3
                    }
                })
            }
        );
            if (![500, 502, 503, 504].includes(response.status) || attempt === 1) break;
            await response.body?.cancel();
        }

        const data = await response.json().catch(() => ({}));
        
        if (!response.ok){
            console.error("Request failed", response.status, model);

            let message = "Gemini is unavailable, try again later";
           
            if (response.status === 429) {
                message = "Gemini request limit reach";
            } 
            else if (response.status === 404) {
                message = "Gemini model unavailable";
            } 
            else if ([401, 403].includes(response.status) || data.error?.details?.some(detail => detail.reason === "API_KEY_INVALID")) {
                message = "Gemini API key failed";
            }
            else if (response.status === 400) {
                message = "Gemini request failed";
            }

            return res.status(response.status === 429 ? 429 : 502).json({
                success: false,
                message
            });
        }
        
        const reply = (data.candidates?.[0]?.content?.parts || [])
            .filter(part => !part.thought && typeof part.text === "string")
            .map(part => part.text)
            .join("\n")
            .trim();

        if(!reply) {
            return res.status(502).json({
                success: false,
                message: "None of the answer returned",
            });
        }

        return res.json({
            success: true,
            reply
        });
    }
    catch (error) {
        return res.status(error.name === "AbortError" ? 504 : 502)
            .json({
                success: false,
                message: error.name === "AbortError" ? "Chatbot took too long, try again later" : "Cannot connect to Gemini, try again"
            });
    }
    finally {
        clearTimeout(timeout);
    }
});

export default router;
