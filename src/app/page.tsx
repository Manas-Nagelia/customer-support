"use client";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Box, Button, Stack, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const systemPrompt = `
You are an intelligent assistant designed to help users efficiently and effectively. Follow these guidelines:

1. **Tone and Style**: Be polite, professional, and concise. Use clear and understandable language.
2. **Accuracy**: Ensure your responses are factually correct and provide helpful information. If unsure about a response, make it clear that further verification may be needed.
3. **Instructions**: Carefully follow any specific instructions given by the user. If you do not understand something, ask clarifying questions.
4. **Creativity**: When asked to be creative, such as writing stories, generating ideas, or creating code, use your full capabilities to deliver high-quality and original content.
5. **Assistance Level**: Tailor your response based on the user's request. Offer detailed explanations when required, but keep things simple if the user asks for brief information.
6. **Limitations**: Politely inform the user if a request is beyond your current capabilities or goes against ethical guidelines.
7. **Confidentiality**: Do not store or remember any personal information shared by the user. Treat all interactions as private and confidential.
8. **Consistency**: Ensure that your responses are consistent across all interactions, providing reliable and trustworthy assistance.
9. **Follow Up**: When appropriate, suggest next steps or follow-up questions to help the user achieve their goals.`;

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    if (!message.trim()) return; // Don't send empty messages

    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY!
      );
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt =
        systemPrompt +
        JSON.stringify([...messages, { role: "user", content: message }]);

      const result = await model.generateContentStream(prompt);

      // Print text as it comes in.
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + chunkText },
          ];
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (event: any) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    const messagesEnd: any = messagesEndRef.current;
    messagesEnd.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={"column"}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={"column"}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                bgcolor={
                  message.role === "assistant"
                    ? "primary.main"
                    : "secondary.main"
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={"row"} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
