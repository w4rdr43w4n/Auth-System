import React, { createContext, useContext, useState, ReactNode } from "react";
import Msg from "@/components/Message";
import { MsgType } from "@/lib/types";
import settings from "@/config/settings";
interface MsgContextType {
  showMsg: (message: string, type?: MsgType, duration?: number) => void;
}

const MsgContext = createContext<MsgContextType | undefined>(undefined);

export const MsgProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [msg, setMsg] = useState<ReactNode | null>(null);

  const showMsg = (
    message: string,
    type: MsgType = "info",
    duration: number = settings.msgDurarion
  ) => {
    setMsg(
      <Msg
        message={message}
        type={type}
        duration={duration}
        onClose={() => setMsg(null)}
      />
    );
    setTimeout(() => setMsg(null), duration);
  };

  return (
    <MsgContext.Provider value={{ showMsg }}>
      {children}
      {msg}
    </MsgContext.Provider>
  );
};

export const useMsg = () => {
  const context = useContext(MsgContext);
  if (!context) {
    throw new Error("useMsg must be used within a MsgProvider");
  }
  return context;
};
