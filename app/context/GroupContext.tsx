import React, { createContext, useContext, useState, ReactNode } from "react";

export type GroupItem = {
  id: string;
  name: string;
  event?: string;
  memberIds: string[];   // ✅ 멤버는 ID만 저장
};

type GroupContextType = {
  groups: GroupItem[];
  setGroups: React.Dispatch<React.SetStateAction<GroupItem[]>>;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<GroupItem[]>([
    {
      id: "g1",
      name: "경희녀들",
      event: "맛집 투어",
      memberIds: ["u1", "u2", "u3"], // ✅ 멤버 ID만
    },
  ]);

  return (
    <GroupContext.Provider value={{ groups, setGroups }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroups must be used inside GroupProvider");
  return ctx;
}
