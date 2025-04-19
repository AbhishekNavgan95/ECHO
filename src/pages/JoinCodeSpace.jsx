import { useNavigate, useParams } from 'react-router-dom';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '@/contexts/SocketContext';
import EditorComponent from '@/components/cors/Dashboard/codeSpace/Editor';
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiConnector } from '@/services/apiconnector';
import { codeSpaceEndpoints } from '@/services/apis';
import ParticipentList from '@/components/cors/Dashboard/codeSpace/ParticipentList';
import toast from 'react-hot-toast';
import ActionButton from '@/components/common/ActionButton';
import { Button } from '@/components/ui/button';
import Chatbox from '@/components/cors/Dashboard/codeSpace/Chatbox';

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

const languages = ['javascript', 'python', 'html', 'css', 'json', 'typescript'];

const JoinCodeSpace = () => {
    const [codeSpace, setCodeSpace] = useState(null);
    const [code, setCode] = useState('');
    const [chatModalOpen, setChatModalOpen] = useState(false);

    const { codeSpaceId } = useParams();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const user = useSelector((state) => state.profile.user);
    const token = useSelector((state) => state.auth.token);

    useEffect(() => {
        if (!user && !token) {
            return navigate('/login')
        }
    }, [user, token])

    const fetchCodeSpaceDetails = async () => {
        try {
            const response = await apiConnector(
                "GET",
                codeSpaceEndpoints.GET_CODE_ROOM + `/get/${codeSpaceId}`,
                null,
                {
                    Authorization: `Bearer ${token}`,
                }
            );

            const data = response?.data;
            if (data) {
                console.log("data from api : ", data.data)
                setCodeSpace(data?.data);
                setCode(data?.data?.codeContent || '');
            }
        } catch (error) {
            console.error("Error fetching code space:", error?.response?.data?.message || "Something went wrong");
        }
    };

    useEffect(() => {
        if (!user) return;

        const joinRoom = () => {
            socket.emit('joinCodingRoom', {
                roomId: codeSpaceId,
                userId: user._id,
            });

            fetchCodeSpaceDetails();
        };

        if (socket.connected) {
            joinRoom();
        } else {
            socket.on('connect', joinRoom);
        }

        socket.on('getUpdatedRoomDetails', (updatedCodeSpace) => {
            // console.log("data from all update : ", updatedCodeSpace)
            setCodeSpace(updatedCodeSpace);
        });

        socket.on("participentsListUpdated", (codeSpace) => {
            // console.log("codeSpace after updated participents list : ", codeSpace);
            setCodeSpace(prev => ({ ...prev, ...codeSpace }));
        })

        socket.on("languageChanged", ({ language }) => {
            setCodeSpace(prev => ({ ...prev, language: language }));
        })

        socket.on("editorTypeChanged", ({ editorType }) => {
            setCodeSpace(prev => ({ ...prev, editorType: editorType }));
        })

        socket.on("receiveMessage", (lastMessage) => {
            // console.log("lastMessage: ", lastMessage)
            setCodeSpace(prev => ({
                ...prev,
                chatMessages: [...prev.chatMessages, lastMessage]
            }))
        })

        socket.on("codeUpdated", ({ userId, code }) => {
            setCodeSpace(prev => ({ ...prev, codeContent: code }));
            setCode(code);
        });

        return () => {
            socket.emit('leaveCodingRoom', {
                roomId: codeSpaceId,
                userId: user._id,
            });

            socket.off('getUpdatedRoomDetails');
            socket.off("codeUpdated");
            socket.off("kickUser");
            socket.off("toggleAllowEdit");
            socket.off("changeLanguage");
            socket.off("changeEditorType");
            socket.off("updateCode");
            socket.off("leaveCodingRoom");
        };
    }, [socket, codeSpaceId, user, navigate]);

    useEffect(() => {
        if (codeSpace?.kickList?.some(u => u?._id?.toString() === user?._id?.toString())) {
            toast.error("You have been kicked out of the room");
            navigate('/dashboard/code-space');
        }
    }, [codeSpace, navigate, user?._id]);

    const debouncedUpdateCode = useCallback(
        debounce((code) => {
            socket.emit('updateCode', {
                roomId: codeSpaceId,
                userId: user._id,
                code: code,
            });
        }, 600), // 500 ms delay for debounce
        [socket, codeSpaceId, user?._id]
    );

    const handleCodeChange = (newCode) => {
        setCode(newCode)
        debouncedUpdateCode(newCode);
    };

    const handleAllowEditChange = (status, id) => {
        socket.emit('toggleAllowEdit', {
            roomId: codeSpaceId,
            status: status,
            userId: id,
            instructorId: user._id
        });
    }

    // console.log("code space : ", codeSpace)
    const sendMessage = (message) => {
        console.log("sending message")
        socket.emit('sendMessageToCodingRoom', {
            roomId: codeSpaceId,
            userId: user._id,
            message: message,
        });
    }

    const kickUser = (id) => {
        socket.emit('kickUser', {
            roomId: codeSpaceId,
            userId: id,
            instructorId: user._id
        });
    }

    const leaveRoom = () => {
        socket.emit('leaveCodingRoom', {
            roomId: codeSpaceId,
            userId: user._id,
        });
        navigate('/dashboard/code-space');
    };

    const canEdit = useMemo(() => {
        if (!codeSpace || !user) return false;
        return codeSpace?.instructor === user?._id ||
            codeSpace?.participants?.some(
                (p) => p?.user?._id === user?._id && p.role === "editor"
            );
    }, [codeSpace, user]);

    if (window.innerWidth < 768) {
        return (
            <div className="min-h-screen flex flex-col gap-y-5 items-center justify-center text-center px-4 bg-black text-white text-lg font-semibold">
                Use a desktop to access this page.
                <ActionButton active onClick={() => {
                    navigate(-1);
                }} >Go back</ActionButton>
            </div>
        );
    }

    return (
        <div className='px-4 min-h-screen'>
            <div className='text-white min-h-screen flex flex-col pb-4'>
                <div className='flex justify-between items-center'>
                    <button
                        onClick={leaveRoom}
                        className='text-richblack-25 capitalize flex font-semibold text-xl items-center px-2 py-2 gap-x-3'
                    >
                        <MdOutlineKeyboardArrowLeft /> {codeSpace?.name || "CodeSpace"}
                    </button>

                    <div className='flex items-center gap-x-4'>

                        <Chatbox codeSpaceMessages={codeSpace?.chatMessages} sendMessage={sendMessage} chatModalOpen={chatModalOpen} setChatModalOpen={setChatModalOpen} />

                        {/* editor type */}
                        <Select
                            disabled={!canEdit}
                            value={codeSpace?.editorType}
                            onValueChange={(val) => {
                                socket.emit("changeEditorType", {
                                    roomId: codeSpaceId,
                                    userId: user._id,
                                    editorType: val,
                                });
                            }}
                        >
                            <SelectTrigger className="w-[180px] my-4">
                                <SelectValue placeholder="editorType" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value='simple'>Simple</SelectItem>
                                    <SelectItem value='diff'>Difference</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {/* language */}
                        <Select
                            disabled={!canEdit}
                            value={codeSpace?.language}
                            onValueChange={(val) => {
                                socket.emit("changeLanguage", {
                                    roomId: codeSpaceId,
                                    userId: user._id,
                                    language: val,
                                });
                            }}
                        >
                            <SelectTrigger className="w-[180px] my-4">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {languages.map((lang, index) => (
                                        <SelectItem key={index} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className='grid grid-cols-12 place-items-stretch gap-x-5 flex-1'>
                    <EditorComponent
                        language={codeSpace?.language}
                        code={code}
                        editorType={codeSpace?.editorType}
                        onChange={handleCodeChange}
                        readOnly={!canEdit}
                    />

                    <div className='col-span-2'>
                        <ParticipentList kickUser={kickUser} isInstructor={codeSpace?.instructor?.toString() === user?._id} handleAllowEditChange={handleAllowEditChange} participants={codeSpace?.participants} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinCodeSpace;
