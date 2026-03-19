import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown';


export type Message = {
  content : string,
  role: "user" | "bot"
}

type Props = {
    messages: Message[]
}

  const onCopyMessage = (e: React.ClipboardEvent<HTMLParagraphElement>): void => {
    const selection = window.getSelection?.toString().trim();
    if (selection) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', selection);
    }
  };


export const ChatMessages = ({ messages } : Props ) => {
    const lastMessageRef = useRef<HTMLDivElement | null>(null);

    useEffect(()=>{
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth'})
  }, [messages])
  return (
    <div className='flex flex-col gap-3'>
        {messages.map((message, index) => (<div 
        ref={ index === messages.length -1 ? lastMessageRef : null}
        onCopy={onCopyMessage}
        className={`px-3 py-1 max-w-md rounded-xl text-2xl  ${
            message.role === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-gray-100 text-black self-start'
            }`} key={index}>
            <ReactMarkdown>
            {message.content}
            </ReactMarkdown>
            
            </div>))}
    </div>
  )
}

export default ChatMessages;
