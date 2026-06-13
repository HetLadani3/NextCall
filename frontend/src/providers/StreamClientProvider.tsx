import React, { useEffect, useState } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

const apiKey = import.meta.env.VITE_STREAM_API_KEY || "qttb6m7xuk9p";

export const StreamVideoProvider = ({ children }: { children: React.ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!apiKey || apiKey === "your-stream-api-key") return;

    const tokenProvider = async () => {
      const response = await apiFetch("/stream/token");
      return response.token;
    };

    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: user.id,
        name: user.name || user.email,
        image: `https://getstream.io/random_svg/?id=${user.id}&name=${user.name}`,
      },
      tokenProvider,
    });

    setVideoClient(client);

    return () => {
      client.disconnectUser();
    };
  }, [user]);

  if (!apiKey || apiKey === "your-stream-api-key") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Stream API Key Required</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            The frontend is missing a valid <code>VITE_STREAM_API_KEY</code>. Please create/update your <code>.env</code> file in the <code>frontend</code> folder with a real GetStream API key.
          </p>
          <div className="bg-gray-950 p-4 rounded-lg text-left text-xs font-mono text-pink-400 overflow-x-auto border border-gray-800">
            VITE_STREAM_API_KEY=your_actual_stream_api_key
          </div>
        </div>
      </div>
    );
  }

  if (!videoClient) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

