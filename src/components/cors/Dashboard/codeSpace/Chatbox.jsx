import { Button } from '@/components/ui/button'
import React, { useEffect, useRef, useState } from 'react'
import { IoMdSend } from "react-icons/io";
import { useSelector } from 'react-redux';

const Chatbox = ({
    chatModalOpen,
    setChatModalOpen,
    sendMessage,
    codeSpaceMessages
}) => {
    const [message, setMessage] = useState('');
    const user = useSelector((state) => state.profile.user);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const scrollToBottom = () => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        };

        scrollToBottom(); // run on mount and when messages update
    }, [codeSpaceMessages, chatModalOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("message : ", message);
        sendMessage(message);
        setMessage('');
    }

    return (
        <div className='relative'>
            <Button onClick={() => setChatModalOpen(prev => !prev)} variant="outline" className="text-richblack-900">
                {
                    chatModalOpen
                        ? <span className='text-richblack-900'>Close Chat</span>
                        : <span className='text-richblack-900'>Open Chat</span>
                }
            </Button>
            {
                chatModalOpen &&
                <div className='absolute right-[50%] translate-x-[50%] flex flex-col mt-4 z-[9] w-[520px] rounded-md h-[700px] bg-richblack-700 border overflow-hidden border-richblack-500'>
                    <div className='bg-richblack-800 p-4 '>
                        <h4 className='text-base font-semibold text-center'>Group chat</h4>
                    </div>
                    {
                        codeSpaceMessages?.length > 0
                            ? <div className='p-4 flex flex-col gap-2 h-full overflow-y-scroll mb-10' ref={chatContainerRef}>
                                {
                                    codeSpaceMessages?.map((message, index) => (
                                        <Message isOwner={user?._id?.toString() === message?.sender?._id?.toString()} message={message} key={index} />
                                    ))
                                }
                            </div>
                            : <div className='p-4 flex flex-col gap-2 h-full items-center justify-center overflow-y-scroll'>
                                    <span className='text-richblack-400 font-semibold'>No messages yet</span>
                            </div>
                    }
                    <form onSubmit={handleSubmit} className='absolute bg-richblack-800 flex items-center bottom-0 py-1 w-full'>
                        <input
                            type="text"
                            placeholder='Write your message here...'
                            name="message"
                            className="text-base w-full bg-richblack-800 py-2 px-4 rounded-lg focus:outline-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            id="message"
                        />
                        <div className='flex justify-center'>
                            <button className='p-3'>
                                <IoMdSend />
                            </button>
                        </div>
                    </form>
                </div>
            }
        </div>
    )
}

const Message = ({ message, isOwner }) => {

    console.log("message : ", message)

    return (
        <div className={`flex gap-2 items-start ${isOwner ? "justify-start flex-row-reverse" : ""}`}>
            <img src={message?.sender?.image} alt="user" className='w-4 h-4 mt-1 rounded-full ' />
            <div className='flex flex-col bg-richblack-300 rounded-md p-1 px-3 whitespace-pre-line max-w-[300px]'>
                <span className={`text-richblack-900 font-semibold text-xs ${isOwner && "text-end"}`}>{message?.sender?.firstName} {message?.sender?.lastName}</span>
                <span className={`text-richblack-900 text-sm ${isOwner && "text-end"}`}>{message?.content}</span>
            </div>
        </div>
    )
}

export default Chatbox