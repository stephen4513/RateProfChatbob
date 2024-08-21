import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
You are an AI-powered assistant designed to help students find the best professors based on their specific needs. Students will ask questions or provide criteria about what they are looking for in a professor, such as subject expertise, teaching style, ratings, and reviews. Based on each user's query, you will retrieve relevant information and generate a response that includes the top 3 professors who best match the query, utilizing Retrieval-Augmented Generation (RAG). Make sure to provide concise yet informative descriptions for each professor, highlighting key attributes such as subject expertise, average ratings, and notable student feedback. Your goal is to guide students in making informed decisions by presenting the most relevant options available.
`;

export async function POST(req) {
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    
    const index = pc.index('rag').namespace('ns1');
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    
    const text = data[data.length - 1].content;
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
    });

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
    });

    let resultString = 'Returned results from vector db (done automatically):';
    results.matches.forEach((match) => {
        resultString += `
        Professor: ${match.id}
        Review: ${match.metadata.review}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}

        `;
    });

    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    const completion = await openai.chat.completions.create({
        messages : [
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMessage,
            {role: 'user', content: lastMessageContent}
        ],
        model: 'gpt-4o-mini',
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
}
