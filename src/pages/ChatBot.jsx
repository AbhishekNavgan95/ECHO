import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import botLogo from "../assets/Images/bot.svg";
import ReactMarkdown from "react-markdown";

const allQuestions = [
  "What courses are available?",
  "How do I track my progress?",
  "How can I purchase a course?",
  "What is ECHO aimed for?",
  "Where can I find my enrolled courses?",
  "How to contact support?",
  "How can I connect with instructors?",
  "Is there any cost for using ECHO?",
  "How do I change my profile info?",
  "How do I reset my password?",
];

const ChatBot = () => {
  const [chatBotModalOpen, setChatBotModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [randomQuestions, setRandomQuestions] = useState([]);

  useEffect(() => {
    shuffleQuestions();
  }, []);

  const shuffleQuestions = () => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setRandomQuestions(shuffled.slice(0, 4)); // Show 4 random
  };

  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (chatBotModalOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    // Clean up on unmount
    return () => document.body.classList.remove("no-scroll");
  }, [chatBotModalOpen]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamedResponse]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setStreamedResponse("");
    setStreaming(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/generate`,
        { message: input },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setStreamedResponse((prev) => prev + chunk);
      }

      setMessages((prev) => [...prev, { role: "bot", text: fullResponse }]);
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setStreaming(false);
      setInput("");
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setChatBotModalOpen((prev) => !prev)}
        className="fixed rounded-full border-[6px] border-yellow-100 bottom-5 right-5 md:bottom-10 md:right-10 hover:scale-110 transition-all duration-100 z-[11]"
      >
        <img className="w-8 h-8 md:w-14 md:h-14 rounded-full" src={botLogo} alt="Chatbot" />
      </button>

      {/* Animated Chat Modal */}
      {chatBotModalOpen && (
        <div onClick={(e) => setChatBotModalOpen(false)} className='fixed inset-0 bg-opec z-[10]'>
          <AnimatePresence>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              key="chatbot-modal"
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 350, y: 400, scale: 0 }}
              transition={{ duration: 0.1, ease: "easeInOut" }}
              className="w-full fixed bottom-20 right-6 md:bottom-32 md:right-12 z-40 max-w-[350px] md:max-w-[440px] lg:max-w-[600px] mx-auto p-2 md:p-4 bg-richblack-800 border border-richblack-600 rounded-md shadow-xl"
            >
              {/* Chat history */}
              <div className="bg-gray-100 p-4 rounded-md h-[450px] md:h-[500px] xl:h-[550px] space-y-2 overflow-y-auto mb-4">
                {messages.length === 0 && (
                  <div className="text-center h-full text-gray-500 flex items-center justify-center">
                    <div className="flex items-center justify-center flex-col gap-y-4">
                      
                      <img src={botLogo} className="mix-blend-color-dodge rounded-full w-12 h-12 sm:w-20 sm:h-20 md:w-32 md:h-32" alt="" />

                      <div>
                        <h4 className="text-2xl lg:text-4xl mb-4 font-semibold text-richblack-25">Hello 👋,</h4>
                        <h4 className="text-xl md:text-2xl font-semibold text-richblack-25">EchoBot at Your Service</h4>
                        <p className="text-base mt-2 text-center w-[80%] mx-auto text-richblack-100">
                          Ask me about the platform. Or just pretend like you know it already.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-2">
                        {randomQuestions.map((question, index) => (
                          <button
                            key={index}
                            className="bg-white text-black px-3 py-1 rounded-full hover:bg-yellow-100 text-xs md:text-sm transition"
                            onClick={() => setInput(question)}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
                    <span
                      className={`inline-block text-sm md:text-lg leading-6 md:leading-8 max-w-[500px] whitespace-pre-wrap px-3 py-1 md:py-2 rounded ${msg.role === "user"
                        ? "bg-richblack-100 text-richblack-900"
                        : "bg-white text-black"
                        }`}
                    >
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-100 underline break-all hover:text-blue-700"
                            />
                          ),
                          code: ({ node, inline, className, children, ...props }) => {
                            return inline ? (
                              <code className="bg-richblack-800 text-richblack-100 px-1 py-0.5 rounded break-all">
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-richblack-800 text-richblack-100 p-3 rounded-md overflow-auto text-sm whitespace-pre-wrap break-words">
                                <code {...props}>{children}</code>
                              </pre>
                            );
                          },
                          p: ({ node, ...props }) => (
                            <p className="break-words whitespace-pre-wrap">{props.children}</p>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </span>
                  </div>
                ))}

                {streaming && (
                  <div className="text-left">
                    <span className="inline-block text-sm md:text-lg leading-6 md:leading-8 whitespace-pre-wrap px-3 py-1 max-w-[500px] bg-white text-black rounded">
                      <ReactMarkdown>{streamedResponse}</ReactMarkdown>
                    </span>
                  </div>
                )}

                {/* Scroll Anchor */}
                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="What can ECHOBot do? almost everything! give it a try..."
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={handleSend}
                  disabled={streaming}
                  className="bg-yellow-100 text-richblack-900 px-4 py-2 rounded disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default ChatBot;
