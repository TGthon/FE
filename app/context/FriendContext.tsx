import React, { createContext, useContext, useState, ReactNode } from "react";

type FriendItem = { id: string; name: string, email?: string, avatar?: string};

type FriendContextType = {
  friends: FriendItem[];
  setFriends: React.Dispatch<React.SetStateAction<FriendItem[]>>;
};

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export function FriendProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<FriendItem[]>([
    { id: "u1", name: "김서연", email: "test1@gmail.com", avatar: "https://via.placeholder.com/80" },
    { id: "u2", name: "이윤서", email: "test2@gmail.com", avatar: "https://via.placeholder.com/80" },
    { id: "u3", name: "황유나", email: "test3@gmail.com", avatar: "https://via.placeholder.com/80" },
    { id: "u4", name: "김동희", email: "test4@gmail.com", avatar: "https://via.placeholder.com/80" },
    { id: "u5", name: "이동현", email: "test5@gmail.com", avatar: "https://via.placeholder.com/80" },
  ]);

  return (
    <FriendContext.Provider value={{ friends, setFriends }}>
      {children}
    </FriendContext.Provider>
  );
}

export function useFriends() {
  const ctx = useContext(FriendContext);
  if (!ctx) throw new Error("useFriends must be used inside FriendProvider");
  return ctx;
}
