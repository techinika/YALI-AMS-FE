"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Send,
  Users,
  Search,
  MessageSquare,
  User,
  ChevronLeft,
  Settings,
  Nut,
} from "lucide-react";
import { PageHeader } from "../parts/PageHeader";
import { Member } from "@/types/user";
import { useUsersQuery } from "@/lib/features/userSlice";
import {
  useAddMessageMutation,
  useChatsQuery,
  usePrivateMessagesQuery,
} from "@/lib/features/chatSlice";
import { getUser } from "@/helpers/auth";
import { Message } from "@/types/message";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);

const CustomAvatar = ({
  image,
  senderName,
}: {
  image?: string;
  senderName: string;
}) => {
  const initials = senderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white font-bold text-sm shrink-0 shadow-md">
      {image ? (
        <img
          src={image}
          alt={senderName}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        initials
      )}
    </div>
  );
};

const ChatInterface = ({
  username: initialUsername = "all",
}: {
  username?: string;
}) => {
  const router = useRouter();
  const user = getUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentRecipientId, setCurrentRecipientId] =
    useState<string>(initialUsername);
  const [messageInput, setMessageInput] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const { data: communityMessagesData } = useChatsQuery("", {
    skip: currentRecipientId !== "all",
    pollingInterval: 500,
  });
  const { data: privateMessagesData } = usePrivateMessagesQuery(
    { id: currentRecipientId, oid: user?.id || "" },
    { skip: currentRecipientId === "all", pollingInterval: 500 }
  );

  const [addMessage] = useAddMessageMutation();
  const { data: allUsers } = useUsersQuery("");
  const { data: searchableUsers } = useUsersQuery(usersSearch);

  const members = allUsers?.data ?? [];

  const rawMessages: Message[] = useMemo(() => {
    if (currentRecipientId === "all") {
      return communityMessagesData?.data || [];
    } else {
      return privateMessagesData?.data || [];
    }
  }, [currentRecipientId, communityMessagesData, privateMessagesData]);

  const privateChatPartners: Member[] = useMemo(() => {
    const partnerIds = new Set<string>();
    messages
      .filter(
        (m) =>
          m.receiverId !== "" &&
          (m.senderId === user?.id || m.receiverId === user?.id)
      )
      .forEach((m) => {
        const partnerId = m.senderId === user?.id ? m.receiverId : m.senderId;
        partnerIds.add(partnerId);
      });

    const chatsMap = new Map();
    [...messages].reverse().forEach((chat) => {
      const otherUserId =
        chat.senderId === user?.id ? chat.receiverId : chat.senderId;
      if (otherUserId && otherUserId !== "") {
        if (!chatsMap.has(otherUserId)) {
          chatsMap.set(otherUserId, chat);
        }
      }
    });

    const latestChats = Array.from(chatsMap.values()) as Message[];

    return latestChats
      .map((chat) =>
        members.data.find(
          (u: Member) =>
            u.id ===
            (chat.senderId === user?.id ? chat.receiverId : chat.senderId)
        )
      )
      .filter((u): u is Member => u !== undefined);
  }, [user?.id, members]);

  const filteredChatList = useMemo(() => {
    const list = [
      {
        id: "all",
        title: "Community Chat",
        icon: Users,
        isCommunity: true,
        lastMessage:
          communityMessagesData?.data.at(-1)?.message ||
          "Start the conversation...",
      },
      ...privateChatPartners.map((p) => ({
        id: p.id,
        title: `${p.firstName} ${p.lastName}`,
        icon: User,
        isCommunity: false,
        picture: p?.profileImage?.link,
        lastMessage:
          messages.findLast(
            (m: Message) =>
              (m.senderId === user?.id && m.receiverId === p.id) ||
              (m.senderId === p.id && m.receiverId === user?.id)
          )?.message || "",
      })),
    ];

    if (!chatSearch) return list;

    return list.filter((chat) =>
      chat.title.toLowerCase().includes(chatSearch.toLowerCase())
    );
  }, [communityMessagesData, privateChatPartners, chatSearch, user?.id]);

  const displayedMessages = useMemo(() => {
    let sorted = [...rawMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (messageSearch) {
      sorted = sorted.filter((msg) =>
        msg.message.toLowerCase().includes(messageSearch.toLowerCase())
      );
    }
    return sorted;
  }, [rawMessages, messageSearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedMessage = messageInput.trim();
      if (!trimmedMessage) return;

      const values = {
        message: trimmedMessage,
        senderId: user?.id || "",
        receiverId: currentRecipientId === "all" ? "" : currentRecipientId,
      };

      try {
        await addMessage({ data: values }).unwrap();
        setMessageInput("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [messageInput, user?.id, currentRecipientId, addMessage]
  );

  const recipientUser = useMemo(() => {
    return members.find((u: Member) => u.id === currentRecipientId);
  }, [currentRecipientId]);

  const headerTitle =
    currentRecipientId === "all"
      ? "Community Chat"
      : `${recipientUser?.firstName || "Unknown"} ${
          recipientUser?.lastName || ""
        }`;

  const headerSubtitle =
    currentRecipientId === "all"
      ? `${members.length} members`
      : "Private conversation";

  return (
    <div className="min-h-screen w-full p-4 md:p-8 bg-gray-50 font-sans">
      <PageHeader
        title="Conversations"
        description="Chat with the community and build relationships privately."
        actionTitle="Settings"
        onAction={() => router.push("/dashboard/settings")}
        loading={false}
        Icon={Settings}
        disabled={false}
        second={false}
        actionTitle2=""
        onAction2={() => console.log("ff")}
        loading2={false}
        disabled2={false}
        Icon2={Nut}
      />
      <div className="container mx-auto h-full rounded-2xl shadow-2xl overflow-hidden bg-white flex flex-col lg:flex-row">
        <div
          className={`flex flex-col w-full lg:w-80 shrink-0 border-r border-gray-100 ${
            currentRecipientId && "hidden md:flex"
          }`}
        >
          <div className="p-4 border-b border-gray-100 bg-primary">
            <h2 className="text-xl font-bold text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chats
            </h2>
          </div>

          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Start new chat (Search users)..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
              />
            </div>
            {usersSearch && (
              <div className="absolute z-10 w-72 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {searchableUsers.data.length > 0 ? (
                  searchableUsers.data.map((u: Member) => (
                    <button
                      key={u.id}
                      type="button"
                      className="w-full text-left p-3 flex items-center space-x-3 cursor-pointer hover:bg-blue-50 focus:outline-none focus:bg-blue-100"
                      onClick={() => {
                        setCurrentRecipientId(u.id);
                        setUsersSearch("");
                      }}
                    >
                      <CustomAvatar
                        senderName={u.firstName}
                        image={u?.profileImage?.link}
                      />
                      <span className="font-medium text-sm">
                        {u.firstName} {u.lastName}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="p-3 text-center text-sm text-gray-500">
                    No users found.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredChatList.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 border-b border-gray-100 cursor-pointer transition-colors flex items-start space-x-3 
                            ${
                              chat.id === currentRecipientId
                                ? "bg-indigo-100/70 border-indigo-300 shadow-inner"
                                : "hover:bg-gray-50"
                            }`}
                onClick={() => {
                  setCurrentRecipientId(chat.id);
                  if (usersSearch) setUsersSearch("");
                }}
              >
                <div className="pt-1">
                  {chat.isCommunity ? (
                    <chat.icon className="w-5 h-5 text-primary" />
                  ) : (
                    <CustomAvatar senderName={chat.title} image={chat?.title} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm truncate ${
                      chat.id === currentRecipientId
                        ? "text-primary"
                        : "text-gray-800"
                    }`}
                  >
                    {chat.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {chat.lastMessage ||
                      (chat.isCommunity
                        ? "Start the conversation..."
                        : "New private chat.")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`flex flex-col flex-1 w-full ${
            currentRecipientId ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="p-4 border-b border-gray-100 bg-white shadow-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentRecipientId("all")} // Simple button to show sidebar on mobile
                className="md:hidden p-1 text-primary hover:text-indigo-800 transition"
                aria-label="Back to chat list"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              {currentRecipientId !== "all" &&
                recipientUser?.profileImage?.link && (
                  <CustomAvatar
                    senderName={recipientUser.firstName}
                    image={recipientUser?.profileImage?.link}
                  />
                )}
              <div className="flex flex-col">
                <h2 className="font-bold text-xl text-gray-800">
                  {headerTitle}
                </h2>
                <p className="text-sm text-gray-500">{headerSubtitle}</p>
              </div>
            </div>

            <div className="relative hidden sm:block w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition bg-gray-50"
              />
            </div>
          </div>

          <div
            className={`flex-1 p-6 overflow-y-scroll space-y-4 bg-gray-50 custom-scrollbar`}
          >
            {displayedMessages.length > 0 ? (
              displayedMessages.map((message) => {
                const isSent = message.senderId === user?.id;
                const senderUser = members.find(
                  (u: Member) => u?.id === message?.senderId
                );
                const senderName = senderUser
                  ? `${senderUser.firstName}`
                  : "Unknown";
                const senderImage = senderUser?.profileImage?.link;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 w-full ${
                      isSent ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isSent && (
                      <CustomAvatar
                        image={senderImage}
                        senderName={senderName}
                      />
                    )}

                    <div
                      className={`flex flex-col max-w-sm sm:max-w-lg ${
                        isSent ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`py-2 px-4 rounded-2xl shadow-md transition-all duration-300 ${
                          isSent
                            ? "bg-primary text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                        }`}
                      >
                        {currentRecipientId === "all" && !isSent && (
                          <p className="text-xs font-bold mb-1 opacity-90 text-blue-200">
                            {senderName}
                          </p>
                        )}
                        <p className="text-sm wrap-break-word whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>
                      <p className={`text-xs mt-1 text-gray-500`}>
                        {dayjs(message.createdAt).fromNow()}
                      </p>
                    </div>

                    {isSent && (
                      <CustomAvatar
                        image={senderImage}
                        senderName={senderName}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex h-full w-full justify-center items-center text-gray-500 italic">
                <div className="text-center p-16">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-blue-300" />
                  <p>
                    {messageSearch
                      ? "No messages match your search."
                      : "No messages yet, send one to start the conversation!"}
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white shrink-0">
            <form
              onSubmit={handleSubmit}
              className="flex items-center space-x-3"
            >
              <input
                type="text"
                placeholder={`Message ${headerTitle}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary transition"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-3 bg-primary text-white rounded-xl shadow-lg hover:bg-primary transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
