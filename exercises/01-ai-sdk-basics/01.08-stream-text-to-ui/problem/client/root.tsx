import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatInput, Message, Wrapper } from './components.tsx';
import { useChat } from '@ai-sdk/react';
import './tailwind.css';

const App = () => {
  const { messages, sendMessage } = useChat();

  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (input.trim() === '') return;
    sendMessage({ text: input });
    setInput('');
  };
  return (
    <Wrapper>
      {messages.map((message) => (
        <Message
          key={message.id}
          role={message.role}
          parts={message.parts}
        />
      ))}
      <ChatInput
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      />
    </Wrapper>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
