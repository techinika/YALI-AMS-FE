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
} from "lucide-react";
import { PageHeader } from "../parts/PageHeader";
import { Member } from "@/types/user";
import { useUsersQuery } from "@/lib/features/userSlice";
import {
  useAddMessageMutation,
  useChatsQuery,
  usePrivateChatsQuery,
  usePrivateMessagesQuery,
} from "@/lib/features/chatSlice";
import { getUser } from "@/helpers/auth";
import { Message } from "@/types/message";
import { useRouter, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/sockets";

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

const ChatInterface = () => {
  const router = useRouter();
  const user = getUser();
  const searchParams = useSearchParams();
  const oid: string = searchParams.get("rid") ?? "all";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const socketRef = useRef<any>(null);

  const [currentRecipientId, setCurrentRecipientId] = useState<string>(
    oid ?? "all"
  );
  const [messageInput, setMessageInput] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [recipientUser, setRecipientUser] = useState<Member | null>(null);
  const [headerTitle, setHeaderTitle] = useState("Community Chat");

  const { data: communityMessagesData } = useChatsQuery(undefined, {
    skip: currentRecipientId !== "all",
  });
  const { data: privateMessagesData } = usePrivateMessagesQuery(
    { id: currentRecipientId, oid: user?.id || "" },
  );

  const { data: privateChatsData } = usePrivateChatsQuery(user?.id || "");

  const [addMessage] = useAddMessageMutation();
  const { data: allUsers } = useUsersQuery();
  const { data: searchableUsers } = useUsersQuery();

  useEffect(() => {
    if (allUsers) {
      const otherMembers = allUsers?.data.filter(
        (u: Member) => u.id !== user?.id
      );
      setMembers(otherMembers);
    }
  }, [allUsers, user?.id]);

  useEffect(() => {
    if (currentRecipientId === "all") {
      setRecipientUser(null);
      setHeaderTitle("Community Chat");
      return;
    }

    const found = members.find((m) => m.id === currentRecipientId) || null;
    setRecipientUser(found);

    setHeaderTitle(found ? `${found.firstName} ${found.lastName}` : "Unknown");
  }, [currentRecipientId, members]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("join-room", { room: user?.id });

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [user?.id]);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleNewMessage = (message: Message) => {
      if (
        (currentRecipientId === "all" && message?.public) ||
        (currentRecipientId !== "all" &&
          !message?.public &&
          (message.senderId === currentRecipientId ||
            message.receiverId === currentRecipientId))
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [currentRecipientId]);

  const rawMessages: Message[] = useMemo(() => {
    if (currentRecipientId === "all") {
      return communityMessagesData?.data || [];
    } else {
      return privateMessagesData?.data || [];
    }
  }, [currentRecipientId, communityMessagesData, privateMessagesData]);

  useEffect(() => {
    if (rawMessages.length > 0) {
      setMessages(rawMessages);
    }
  }, [rawMessages]);

  const privateChatPartners: Member[] = useMemo(() => {
    if (!privateChatsData?.data || !user?.id) return [];

    const chatsMap = new Map<string, Message>();

    [...privateChatsData.data]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .forEach((msg) => {
        const otherUserId =
          msg.senderId === user.id ? msg.receiverId : msg.senderId;

        if (otherUserId && !chatsMap.has(otherUserId)) {
          chatsMap.set(otherUserId, msg);
        }
      });

    return Array.from(chatsMap.values())
      .map((chat) =>
        members.find(
          (u: Member) =>
            u.id ===
            (chat.senderId === user.id ? chat.receiverId : chat.senderId)
        )
      )
      .filter((u): u is Member => Boolean(u));
  }, [privateMessagesData?.data, members, user?.id]);

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
        picture: p?.profileImage?.link ?? "/placeholder.svg",
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
    let sorted = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (messageSearch) {
      sorted = sorted.filter((msg) =>
        msg.message.toLowerCase().includes(messageSearch.toLowerCase())
      );
    }
    return sorted;
  }, [messages, messageSearch]);

  useEffect(() => {
    if (!displayedMessages.length) return;

    const lastMessage = displayedMessages.at(-1);
    if (!lastMessage) return;

    if (isFirstLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isFirstLoadRef.current = false;
      lastMessageIdRef.current = lastMessage.id;
      return;
    }

    if (lastMessage.id !== lastMessageIdRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      lastMessageIdRef.current = lastMessage.id;
    }

    if (
      lastMessage.id !== lastMessageIdRef.current &&
      isNearBottomRef.current
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
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
        const result = await addMessage(values).unwrap();
        const created = result?.data as Message | undefined;
        if (created) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === created.id);
            if (exists) return prev;
            return [...prev, created];
          });
        }
        setMessageInput("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [messageInput, user?.id, currentRecipientId, addMessage]
  );

  const headerSubtitle =
    currentRecipientId === "all"
      ? `${members.length} members`
      : "Private conversation";

  return (
    <div className="container mx-auto min-h-screen p-4 sm:p-8 ">
      <PageHeader
        title="Conversations"
        description="Chat with the community and build relationships privately."
        actionTitle="Settings"
        onAction={() => router.push("/dashboard/settings")}
        loading={false}
        Icon={Settings}
        disabled={false}

      />

      <div
        ref={containerRef}
        onScroll={() => {
          const el = containerRef.current;
          if (!el) return;

          isNearBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
        className="rounded shadow bg-white flex flex-col lg:flex-row h-screen overflow-hidden"
      >
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
                {searchableUsers?.data.length ? (
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
                                ? "bg-blue-100/70 border-blue-300 shadow-inner"
                                : "hover:bg-gray-50"
                            }`}
                onClick={() => {
                  router.push(`/dashboard/chat?rid=${chat?.id}`);
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
                onClick={() => setCurrentRecipientId("all")}
                className="md:hidden p-1 text-primary hover:text-primary/80 transition"
                aria-label="Back to chat list"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              {currentRecipientId !== "all" &&
                recipientUser?.profileImage?.link && (
                  <CustomAvatar
                    senderName={recipientUser.firstName}
                    image={
                      `${recipientUser?.profileImage?.link}` ||
                      "/placeholder.svg"
                    }
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
                const senderImage =
                  senderUser?.profileImage?.link ?? "/placeholder.svg";

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
