import React, { useEffect, useReducer, useState } from "react";
import { useSelector } from "react-redux";
import HighlightText from '../components/common/HighlightText';
import CtaButton from '../components/common/CtaButton';
import { VscDash } from "react-icons/vsc";

const rules = [
    {
        "id": 1,
        "rule": "No Spamming",
        "description": "Avoid flooding the chat with repeated messages or unnecessary content."
    },
    {
        "id": 3,
        "rule": "Use Appropriate Language",
        "description": "No profanity or offensive language."
    },
    {
        "id": 4,
        "rule": "No Hate Speech",
        "description": "Discriminatory or hateful comments are not allowed."
    },
    {
        "id": 5,
        "rule": "Protect Personal Information",
        "description": "Do not share your or others' private details."
    },
    {
        "id": 6,
        "rule": "No Advertising or Self-Promotion",
        "description": "Promotional content and links are not allowed."
    },
    {
        "id": 7,
        "rule": "Stay on Topic",
        "description": "Ensure discussions remain relevant to the channel."
    },
    {
        "id": 8,
        "rule": "No Impersonation",
        "description": "Do not pretend to be another user."
    },
    {
        "id": 9,
        "rule": "No Sharing Illegal Content",
        "description": "Posting pirated or illegal material is strictly prohibited."
    },
    {
        "id": 10,
        "rule": "Avoid Political Discussions",
        "description": "Political debates are not allowed."
    },
    {
        "id": 11,
        "rule": "Use Appropriate Usernames",
        "description": "Offensive or misleading usernames are not allowed."
    },
    {
        "id": 12,
        "rule": "Report Violations",
        "description": "Help maintain a safe space by reporting any rule-breaking behavior."
    },
    {
        "id": 13,
        "rule": "No NSFW Content",
        "description": "Explicit or inappropriate content is not permitted."
    },
    {
        "id": 14,
        "rule": "Family-Friendly Conversations",
        "description": "Ensure discussions are suitable for all audiences."
    },
    {
        "id": 15,
        "rule": "No Harassment or Bullying",
        "description": "Any form of harassment or intimidation is not tolerated."
    }
]

const Chat = () => {

    return (
        <div className="min-h-screen bg-richblack-900 text-richblack-5 w-full">
            <div className="relative px-3 max-w-maxContent mx-auto mt-20">
                <div className='flex flex-col gap-5 items-center'>
                    <div className='text-2xl md:text-4xl text-center'>
                        <h1 className='mb-2'>Explore Conversations that Matter </h1>
                        <HighlightText text="Real-Time, All the Time!" />
                    </div>
                    <p className='md:w-[60%] text-richblack-200 text-center'>Join interactive forums tailored to your passions, collaborate with like-minded individuals, and dive into real-time conversations on the topics you care about.</p>
                    <CtaButton active={true} linkTo={'/chat/channels'}>Explore Channels</CtaButton>
                </div>

                <div className='mt-10'>
                    <h5 className='text-2xl font-semibold'>
                        Community Guidelines
                    </h5>
                    <div className='grid sm:grid-cols-2 mt-5 gap-2'>
                        {
                            rules.map((r, index) => (
                                <div key={index} className='py-2 px-5 rounded-lg bg-richblack-800 flex items-start gap-3'>
                                    < VscDash className='mt-1 font-bold' />
                                    <span>
                                        <h5 className='font-semibold'> {r?.rule}</h5>
                                        <p className='text-richblack-200 mt-1 text-sm'>{r.description}</p>
                                    </span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;