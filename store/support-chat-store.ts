import { create } from 'zustand';

interface SupportChatStore {
    isOpen: boolean;
    openChat: ()=> void;
    closeChat: ()=> void;
}

export const useSupportChatStore = create<SupportChatStore>((set)=> ({
    isOpen: false,
    openChat: ()=> set({ isOpen: true}),
    closeChat: ()=> set({isOpen: false}),
}))