const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured.");
}

const ai = apiKey
    ? new GoogleGenAI({ apiKey })
    : null;

async function analyzeHealthImage(imageBuffer, mimeType, analysisType) {
    if (!ai) {
        throw new Error("Gemini API key is not configured.");
    }

    const imageBase64 = imageBuffer.toString("base64");

    let prompt;

    if (analysisType === "skin") {
        prompt = `
You are an AI health education assistant for CareOn, a rural healthcare
support platform.

Analyze the uploaded skin image for educational purposes only.

Provide:
1. Visible observations
2. Possible general categories or conditions that could resemble these observations
3. What information would help a healthcare professional evaluate it
4. General precautionary advice
5. When the person should seek professional medical care

Do NOT provide a definitive diagnosis.
Do NOT prescribe medicines or dosages.
Clearly state that image-based analysis cannot replace examination by a qualified healthcare professional.
`;
    } else {
        prompt = `
You are an AI health education assistant for CareOn, a rural healthcare
support platform.

Analyze the uploaded medical report image.

Extract and explain:
1. Important test names and values that are clearly readable
2. General interpretation of abnormal or notable values
3. What the results may commonly indicate
4. Questions the patient could discuss with a healthcare professional
5. Any values that may require timely medical attention

Do NOT provide a definitive diagnosis.
Do NOT prescribe medicines or dosages.
If a value cannot be read reliably, say so rather than guessing.
`;
    }

    const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: [
            {
                type: "text",
                text: prompt,
            },
            {
                type: "image",
                data: imageBase64,
                mime_type: mimeType,
            },
        ],
    });

    return interaction.output_text;
}

module.exports = {
    analyzeHealthImage,
};