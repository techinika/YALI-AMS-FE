"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Send,
  MessageSquare,
  X,
  ChevronRight,
  Hash,
  Info,
  UserPlus,
  MoreVertical,
  MessageCircle,
} from "lucide-react";
import { PageHeader } from "../parts/PageHeader";

const appId = typeof __app_id !== "undefined" ? __app_id : "group-chat-manager";

const POTENTIAL_MEMBERS = [
  { id: "u1", name: "Alex Chen", title: "Fullstack Dev", color: "bg-primary" },
  {
    id: "u2",
    name: "Sarah Miller",
    title: "UX Researcher",
    color: "bg-rose-500",
  },
  {
    id: "u3",
    name: "James Wilson",
    title: "Data Scientist",
    color: "bg-emerald-500",
  },
  {
    id: "u4",
    name: "Elena Rossi",
    title: "Growth Marketer",
    color: "bg-amber-500",
  },
  {
    id: "u5",
    name: "David Park",
    title: "Product Manager",
    color: "bg-primary",
  },
];

export const GroupChatsPage = () => {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const scrollRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup || !user) return;

    try {
      setNewMessage("");
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    try {
      const newGroupData = {
        name: newGroupName,
        memberCount: selectedMembers.length + 1,
        createdBy: user,
        createdAt: new Date(),
        members: [...selectedMembers.map((m) => m.id), user.uid],
        lastMessage: "Group created",
      };

      setShowCreateModal(false);
      setNewGroupName("");
      setSelectedMembers([]);
    } catch (err) {
      console.error("Create Group Error:", err);
    }
  };

  const toggleMemberSelection = (member) => {
    setSelectedMembers((prev) =>
      prev.find((m) => m.id === member.id)
        ? prev.filter((m) => m.id !== member.id)
        : [...prev, member]
    );
  };

  return (
    <div className="container mx-auto min-h-screen p-4 sm:p-8">
      <PageHeader
        title="Group Chats & Communities"
        description="Join Communities and Start Chatting with like-minded members."
        actionTitle={"Single Chats"}
        Icon={MessageCircle}
        onAction={() => console.log(true)}
        loading={false}
        disabled={false}
        second={false}
        actionTitle2=""
        onAction2={() => console.log("ff")}
        loading2={false}
        disabled2={false}
        Icon2={MessageCircle}
      />
      <div className="flex h-screen overflow-hidden rounded">
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold tracking-tight">Communities</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 bg-blue-50 text-primary rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Explore groups..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {groups
              .filter((g) =>
                g.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveGroup(group)}
                  className={`w-full flex items-center p-3 rounded-xl transition-all ${
                    activeGroup?.id === group.id
                      ? "bg-blue-50 text-primary/80 shadow-sm border border-blue-100"
                      : "hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 font-bold ${
                      activeGroup?.id === group.id
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Hash className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{group.name}</p>
                    <p className="text-[11px] opacity-70 truncate font-medium">
                      {group.memberCount} Members •{" "}
                      {group.lastMessage || "No messages"}
                    </p>
                  </div>
                  {activeGroup?.id === group.id && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ))}
            {groups.length === 0 && (
              <div className="text-center py-12 px-6">
                <p className="text-sm text-gray-400 italic">
                  No groups found. Create one to get started!
                </p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white">
          {activeGroup ? (
            <>
              <header className="h-20 border-b border-gray-100 px-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {activeGroup.name}
                    </h2>
                    <div className="flex items-center text-[11px] font-semibold text-green-600">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                      Live Activity
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
                    <Info className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FDFDFF]">
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div
                      key={msg.id || i}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      } group animate-in fade-in slide-in-from-bottom-2`}
                    >
                      <div className={`max-w-[70%] ${isMe ? "order-2" : ""}`}>
                        {!isMe && (
                          <p className="text-[10px] font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                            {msg.senderName}
                          </p>
                        )}
                        <div
                          className={`px-5 py-3 rounded-2xl text-sm shadow-sm ${
                            isMe
                              ? "bg-primary text-white rounded-tr-none"
                              : "bg-white border border-gray-100 text-gray-700 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <p
                          className={`text-[9px] mt-1.5 text-gray-400 ${
                            isMe ? "text-right mr-1" : "ml-1"
                          }`}
                        >
                          {msg.timestamp?.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) || "Sending..."}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              <footer className="p-6 border-t border-gray-100">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center space-x-4 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-blue-300 transition-all"
                >
                  <input
                    type="text"
                    placeholder={`Message in #${activeGroup.name.toLowerCase()}...`}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-2"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-primary/80 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/30">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Select a community
              </h3>
              <p className="text-gray-500 max-w-sm">
                Explore your active group chats on the left or create a new one
                to start collaborating.
              </p>
            </div>
          )}
        </main>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
                <div>
                  <h3 className="text-lg font-bold">New Collaborative Group</h3>
                  <p className="text-xs opacity-80">Assemble your dream team</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">
                    Group Identity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Next-Gen SaaS Founders"
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Select Members
                    </label>
                    <span className="text-[10px] font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                      {selectedMembers.length} Selected
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {POTENTIAL_MEMBERS.map((member) => {
                      const isSelected = selectedMembers.find(
                        (m) => m.id === member.id
                      );
                      return (
                        <button
                          key={member.id}
                          onClick={() => toggleMemberSelection(member)}
                          className={`w-full flex items-center p-3 rounded-2xl border transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-200 shadow-sm"
                              : "bg-white border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white text-[10px] font-bold mr-3`}
                          >
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="text-left flex-1">
                            <p className="text-xs font-bold text-gray-900">
                              {member.name}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {member.title}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "bg-primary border-primary text-white"
                                : "border-gray-200"
                            }`}
                          >
                            {isSelected && (
                              <Plus className="w-3 h-3 rotate-45" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="px-8 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/80 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
