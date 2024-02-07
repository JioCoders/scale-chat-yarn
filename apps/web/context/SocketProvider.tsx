'use client'
import React, { useCallback, useContext, useEffect, useState, }  from "react";
import { Socket, io } from "socket.io-client";

interface SocketProviderProps {
    children?: React.ReactNode;
}
interface ISocketContext {
    sendMessage: (msg: string) => any;
    messages: string[];
}
const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
    const state = useContext(SocketContext);
    if (!state) throw new Error(`state is undefined`);

    return state;
} 

export const SocketProvider: React.FC<SocketProviderProps> = ({children}) => {
    const [socket, setSocket]= useState<Socket>();
    const [messages, setMessage] = useState<string[]>([]);

    const sendMessage: ISocketContext['sendMessage'] = useCallback((msg) =>{
        console.log("Send Message", msg);
        if(socket){
            socket.emit("event:message", {message: msg});
        }
    },[socket]);

    const onMessageRecd = useCallback((msg: string) => {
        console.log('From Server Msg Received: ', msg);    
        const {message} = JSON.parse(msg) as {message: string}
        setMessage(prev => [...prev, message]);
    }, []);

    useEffect(() => {
        const nodeEnv: string = (process.env.URL as string);
        const url = nodeEnv || 'http://localhost:8000';
        console.log('url is-------------->>', url);
        
        const _socket = io(url);
        _socket.on('message', onMessageRecd);
        setSocket(_socket);

        return () => {
            _socket.off('message', onMessageRecd);
            _socket.disconnect();
            setSocket(undefined);
        };
    }, []);
    return (
        <SocketContext.Provider value = {{sendMessage, messages}}>
            {children}
        </SocketContext.Provider>
        );
}