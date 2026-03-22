
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY_SOFIA_V2;
const model = "gemini-3.1-pro-preview";

async function test() {
    console.log("Testing with API Key:", apiKey ? "EXISTS" : "MISSING");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: "Hola" }] }]
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("STATUS:", res.status);
        console.log("RESPONSE:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("FETCH ERROR:", e);
    }
}

test();
