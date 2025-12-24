"use client";

import React, { useState } from "react";

import {
  User,
  Users,
  MessageSquare,
  Plus,
  Check,
  Loader2,
  Brain,
  Search,
  Info,
  ArrowRight,
  Zap,
  Users2Icon,
} from "lucide-react";
import { toastError } from "@/lib/toast";
import { PageHeader } from "../parts/PageHeader";
import { AVAILABLE_INTERESTS } from "@/helpers/data";

const MOCK_DATA = {
  users: [
    {
      id: "u1",
      name: "Alex Chen",
      title: "Fullstack Dev",
      bio: "Looking for a co-founder for a green-tech app.",
      interests: ["tech", "business"],
    },
    {
      id: "u2",
      name: "Sarah Miller",
      title: "UX Researcher",
      bio: "Passionate about human-centered design in health.",
      interests: ["wellness", "art"],
    },
    {
      id: "u3",
      name: "James Wilson",
      title: "Data Scientist",
      bio: "AI researcher interested in music recommendation.",
      interests: ["tech", "music"],
    },
    {
      id: "u4",
      name: "Elena Rossi",
      title: "Growth Marketer",
      bio: "Scaling SaaS products in the educational space.",
      interests: ["business", "edu"],
    },
  ],
  groups: [
    {
      id: "g1",
      name: "The Alpha Founders",
      members: 12,
      description: "High-growth startup founders sharing resources.",
      interests: ["business", "tech"],
    },
    {
      id: "g2",
      name: "Digital Zen",
      members: 45,
      description: "A community for wellness and tech balance.",
      interests: ["wellness", "tech"],
    },
  ],
};

const apiKey = "";

export const AIInterestMatching = () => {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [aspirations, setAspirations] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState(null);

  const runMatchingAI = async () => {
    if (selectedInterests.length === 0 && !aspirations.trim()) {
      toastError("Please select interests or add a description first.");
      return;
    }

    setIsMatching(true);
    setError(null);

    const prompt = `
            Act as a professional networking matchmaker. 
            User Profile:
            - Interests: ${selectedInterests.join(", ")}
            - Aspirations: ${aspirations}

            Compare this user against these existing Users: ${JSON.stringify(
              MOCK_DATA.users
            )}
            And these Groups: ${JSON.stringify(MOCK_DATA.groups)}

            Identify:
            1. Up to 3 most compatible users.
            2. Up to 2 compatible groups.
            3. A brief "Compatibility Reason" for the recommendations.

            Return the response in valid JSON format only:
            {
              "matchedUsers": ["userId1", "userId2"],
              "matchedGroups": ["groupId1"],
              "aiReasoning": "Summary of why these matches were picked based on common goals."
            }
        `;

    try {
      let attempt = 0;
      while (attempt < 5) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );

          if (!response.ok) throw new Error("API failed");

          const result = await response.json();
          const aiOutput = JSON.parse(
            result.candidates[0].content.parts[0].text
          );

          const finalUsers = MOCK_DATA.users.filter((u) =>
            aiOutput.matchedUsers.includes(u.id)
          );
          const finalGroups = MOCK_DATA.groups.filter((g) =>
            aiOutput.matchedGroups.includes(g.id)
          );

          setMatches({
            users: finalUsers,
            groups: finalGroups,
            reason: aiOutput.aiReasoning,
          });
          break;
        } catch (e) {
          attempt++;
          if (attempt === 5) throw e;
        }
      }
    } catch (err) {
      console.error(err);
      toastError("AI Matchmaking failed. Please try again.");
    } finally {
      setIsMatching(false);
    }
  };

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 container mx-auto">
      <PageHeader
        title="Member AI Matchmaking"
        description="Enter the circle of like-minded individuals and start collaborating and sharing insights."
        actionTitle={"Group Chats"}
        Icon={Users2Icon}
        onAction={() => console.log(true)}
        loading={false}
        disabled={false}
        second={false}
        actionTitle2=""
        onAction2={() => console.log("ff")}
        loading2={false}
        disabled2={false}
        Icon2={User}
      />

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Brain className="w-24 h-24" />
            </div>

            <h2 className="text-lg font-bold mb-6 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-primary" />
              Define Your Interests
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-3">
                  Choose Your Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleInterest(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                        selectedInterests.includes(item.id)
                          ? "bg-primary border-primary text-white shadow-md"
                          : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {selectedInterests.includes(item.id) && (
                        <Check className="w-3 h-3 ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-3">
                  Your Aspirations & Bio
                </label>
                <textarea
                  value={aspirations}
                  onChange={(e) => setAspirations(e.target.value)}
                  placeholder="e.g. I want to build a decentralized library for researchers and find a design partner..."
                  className="w-full min-h-35 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm resize-none"
                />
              </div>

              <button
                onClick={runMatchingAI}
                disabled={isMatching}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold flex items-center justify-center space-x-3 transition-all shadow-lg shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isMatching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Profiles...</span>
                  </>
                ) : (
                  <>
                    <span>Find My Matches</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              {error && (
                <p className="text-red-500 text-xs text-center font-medium">
                  {error}
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {!matches && !isMatching ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ready to expand your circle?
              </h3>
              <p className="text-gray-500 max-w-sm">
                Fill in your interests and let our AI search the community for
                the best collaborators and groups for you.
              </p>
            </div>
          ) : isMatching ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white h-32 rounded-2xl border border-gray-100"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-start space-x-4">
                <div className="bg-primary rounded-lg p-2 shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary mb-1">
                    AI Matchmaking Logic
                  </h4>
                  <p className="text-sm text-primary leading-relaxed italic">
                    "{matches.reason}"
                  </p>
                </div>
              </div>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary" />
                    Recommended People
                  </h3>
                  <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-1 rounded">
                    {matches.users.length} Found
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.users.map((u: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; bio: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
                    <div
                      key={u.id}
                      className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                          {u.name
                            .split(" ")
                            .map((n: any[]) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {u.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                            {u.title}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-4 line-clamp-2">
                        {u.bio}
                      </p>
                      <div className="flex items-center space-x-2">
                        <button className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-primary rounded-lg text-xs font-bold transition-colors flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 mr-1.5" />
                          Chat
                        </button>
                        <button className="p-2 border border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                          <Plus className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <Users className="w-5 h-5 mr-2 text-primary" />
                    Existing Groups
                  </h3>
                </div>
                {matches.groups.length > 0 ? (
                  <div className="space-y-4">
                    {matches.groups.map((g: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; members: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
                      <div
                        key={g.id}
                        className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">
                              {g.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {g.members} active members
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all">
                          Join Group
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                    <Info className="w-6 h-6 text-amber-500 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-amber-900 mb-1">
                      No matching groups yet
                    </h4>
                    <p className="text-xs text-amber-700 mb-4">
                      Would you like to start a new group with your matched
                      users?
                    </p>
                    <button className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm">
                      Create Collaborative Group
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
