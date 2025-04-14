import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import ActionButton from '@/components/common/ActionButton';
import { socket } from '@/App';

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const JoinCodeSpace = () => {
    const { codeSpaceId } = useParams();
    const user = useSelector((state) => state.profile.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (codeSpaceId) {
            socket.on('userJoined', ({ userId }) => {
                console.log("user joined : ", userId)
            });

            socket.emit('joinCodingRoom', { roomId: codeSpaceId, userId: user._id });
        }

        return () => {
            socket.disconnect();
            console.log("user disconnected : ", user._id)
        };
    }, [codeSpaceId, user, navigate]);

    return <div>

        {/* <ActionButton onClick={connectToCodingRoom} >Connect</ActionButton> */}
    </div>;
};

export default JoinCodeSpace;
