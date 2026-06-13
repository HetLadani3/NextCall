import React, { createContext, useContext, useState, useEffect } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useLocation, useNavigate } from "react-router-dom";

interface MeetingContextType {
  activeCall: Call | null;
  isMinimized: boolean;
  isSetupComplete: boolean;
  setIsSetupComplete: (val: boolean) => void;
  setActiveCall: (call: Call | null) => void;
  setIsMinimized: (val: boolean) => void;
  joinMeeting: (callId: string) => Promise<Call>;
  endCall: () => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const client = useStreamVideoClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Listen to path changes to automatically minimize if navigating away from the active meeting
  useEffect(() => {
    if (activeCall) {
      const isOnMeetingPage = location.pathname.startsWith(`/meeting/${activeCall.id}`);
      if (!isOnMeetingPage) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    } else {
      setIsMinimized(false);
    }
  }, [location.pathname, activeCall]);

  const joinMeeting = async (callId: string) => {
    if (!client) throw new Error("Stream client not initialized");
    
    // If we already have a call with this ID, return it
    if (activeCall && activeCall.id === callId) {
      return activeCall;
    }

    // Otherwise, leave any existing call
    if (activeCall) {
      try {
        await activeCall.leave();
      } catch (err) {
        console.error("Error leaving call in joinMeeting:", err);
      }
    }

    const call = client.call("default", callId);
    await call.getOrCreate();
    
    setActiveCall(call);
    setIsMinimized(false);
    setIsSetupComplete(false);
    return call;
  };

  const endCall = async () => {
    if (activeCall) {
      try {
        await activeCall.leave();
      } catch (err) {
        console.error("Error leaving call in endCall:", err);
      }
      setActiveCall(null);
    }
    setIsMinimized(false);
    setIsSetupComplete(false);
    navigate("/");
  };

  return (
    <MeetingContext.Provider
      value={{
        activeCall,
        isMinimized,
        isSetupComplete,
        setIsSetupComplete,
        setActiveCall,
        setIsMinimized,
        joinMeeting,
        endCall,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return context;
};
