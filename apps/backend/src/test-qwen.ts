import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

async function testQwen() {
    console.log("Testing Qwen 2.5 VL on HF Router...");
    try {
        const response = await axios.post('https://router.huggingface.co/v1/chat/completions', {
            model: "Qwen/Qwen2.5-VL-7B-Instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What is in this image? Output JSON." },
                        { type: "image_url", image_url: { url: "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/cake.png" } }
                    ]
                }
            ],
            max_tokens: 100
        }, {
            headers: { 'Authorization': `Bearer ${HF_API_KEY}` }
        });
        console.log("Response:", response.data.choices[0].message.content);
    } catch (error: any) {
        console.error("Error:", error.response?.data || error.message);
    }
}

testQwen();
