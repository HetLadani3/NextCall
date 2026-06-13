import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  StreamTheme,
  useCallStateHooks,
  CallControls,
  SpeakerLayout,
  PaginatedGridLayout,
  CallParticipantsList,
  useCall,
} from "@stream-io/video-react-sdk";
import { useMeeting } from "../context/MeetingContext";

export const Meeting: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { activeCall, isSetupComplete, setIsSetupComplete, joinMeeting } = useMeeting();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    
    const initCall = async () => {
      try {
        setLoading(true);
        await joinMeeting(id);
      } catch (error) {
        console.error("Failed to initialize call:", error);
      } finally {
        setLoading(false);
      }
    };

    initCall();
  }, [id, user]);

  if (!user || loading) return <div className="flex items-center justify-center h-[60vh] w-full text-white">Loading...</div>;

  if (!activeCall) return <p className="text-center text-3xl font-bold text-white mt-12">Call Not Found</p>;

  return (
    <main className="min-h-[80vh] w-full rounded-2xl overflow-hidden bg-dark-2">
      <StreamTheme>
        {!isSetupComplete ? (
          <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
        ) : (
          <MeetingRoom />
        )}
      </StreamTheme>
    </main>
  );
};

const MeetingSetup = ({ setIsSetupComplete }: { setIsSetupComplete: (value: boolean) => void }) => {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone } = useMicrophoneState();
  const { camera } = useCameraState();
  const [isMicCamToggledOn, setIsMicCamToggledOn] = useState(false);
  const call = useCall();

  if (!call) {
    throw new Error("useCall must be used within StreamCall component");
  }

  React.useEffect(() => {
    if (isMicCamToggledOn) {
      camera?.disable();
      microphone?.disable();
    } else {
      camera?.enable();
      microphone?.enable();
    }
  }, [isMicCamToggledOn, camera, microphone]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-2xl font-bold">Setup</h1>
      <div className="flex items-center justify-center gap-3">
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isMicCamToggledOn}
            onChange={(e) => setIsMicCamToggledOn(e.target.checked)}
          />
          Join with mic and camera off
        </label>
      </div>
      <button
        className="rounded-md bg-blue-primary px-4 py-2.5 hover:bg-blue-600 transition"
        onClick={async () => {
          await call.join();
          setIsSetupComplete(true);
        }}
      >
        Join Meeting
      </button>
    </div>
  );
};

const MeetingRoom = () => {
  const { endCall } = useMeeting();
  const [layout, setLayout] = useState<"grid" | "speaker-left" | "speaker-right">("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div className={`h-[calc(100vh-86px)] ${showParticipants ? "block" : "hidden"} ml-2`}>
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>

      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 flex-wrap p-4 bg-dark-1">
        <CallControls onLeave={endCall} />
        
        <div className="flex items-center gap-3">
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as any)}
            className="rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] text-white border-none outline-none cursor-pointer text-sm"
          >
            <option value="speaker-left">Speaker Left</option>
            <option value="speaker-right">Speaker Right</option>
            <option value="grid">Grid</option>
          </select>

          <button
            onClick={() => setShowParticipants((prev) => !prev)}
            className="rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] text-sm"
          >
            Users
          </button>
        </div>
      </div>
    </section>
  );
};
