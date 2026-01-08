"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Send,
  MessageSquare,
  ChevronRight,
  Hash,
  Info,
  UserPlus,
  MoreVertical,
  MessageCircle,
} from "lucide-react";
import { PageHeader } from "../parts/PageHeader";
import CreateGroupChat from "../parts/models/CreateGroupChat";
import { getUser } from "@/helpers/auth";
import { useUsersQuery } from "@/lib/features/userSlice";
import {
  useAcceptGroupInvitationMutation,
  useAddNewGroupMemberMutation,
  useApproveGroupJoinRequestMutation,
  useDeclineGroupInvitationMutation,
  useGetAllGroupMessagesQuery,
  useGetMyGroupsQuery,
  useGetUsersToInviteQuery,
  useRejectJoinRequestMutation,
  useSendGroupMessageMutation,
} from "@/lib/features/chatSlice";
import Loading from "@/app/loading";
import {
  Group,
  GROUP_STATUS_UI,
  groupJoinStatusTypes,
  GroupMessage,
} from "@/types/message";
import { useRouter } from "next/navigation";
import Modal from "../parts/models/Modal";
import { Member } from "@/types/user";
import { toastError, toastSuccess } from "@/lib/toast";

export const GroupChatsPage = () => {
  const user = getUser();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState([]);
  const [pendingGroup, setPendingGroup] = useState<Group | null>(null);
  const [showGroupStatusModal, setShowGroupStatusModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [membersInvite, setMembersInvite] = useState([]);

  const [sendGroupMessage] = useSendGroupMessageMutation();
  const [declineGroupInvitation] = useDeclineGroupInvitationMutation();
  const [acceptGroupInvitation] = useAcceptGroupInvitationMutation();
  const [approveGroupJoinRequest] = useApproveGroupJoinRequestMutation();
  const [rejectJoinRequest] = useRejectJoinRequestMutation();
  const [addNewGroupMember] = useAddNewGroupMemberMutation();

  const { data: membersData = [], isLoading: usersLoading } = useUsersQuery("");
  const { data: membersToInviteData = [] } = useGetUsersToInviteQuery(
    { currentUserId: user?.id, activeGroupId: activeGroup?.id },
    {
      skip: !activeGroup,
    }
  );

  useEffect(() => {
    if (membersToInviteData?.data) {
      setMembersInvite(membersToInviteData?.data);
    }
  }, [activeGroup, membersToInviteData]);

  const groupUserIds = new Set(activeGroup?.members?.map((m) => m.id));

  const inviteCandidates = membersInvite
    .filter((u) => !groupUserIds.has(u))
    .filter((u: Member) =>
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(inviteSearch.toLowerCase())
    );

  const joinRequests =
    activeGroup?.members?.filter(
      (m) => m.status === groupJoinStatusTypes.ADMIN_APPROVAL_PENDING
    ) ?? [];

  const {
    data: groupsData = [],
    isLoading: groupsLoading,
    refetch: groupRefetching,
  } = useGetMyGroupsQuery(user?.id);

  const { data: groupsMessagesData = [], isLoading: groupsMessagesLoading } =
    useGetAllGroupMessagesQuery(
      { groupId: activeGroup?.id || "", userId: user?.id },
      {
        skip: !activeGroup?.id,
        pollingInterval: 1500,
      }
    );

  useEffect(() => {
    if (membersData?.data) {
      setMembers(membersData?.data);
    }
  }, [membersData]);

  useEffect(() => {
    if (groupsData?.data) {
      setGroups(groupsData?.data);
    }
  }, [groupsData, groupRefetching]);

  useEffect(() => {
    if (groupsMessagesData?.data) {
      setMessages(groupsMessagesData?.data);
    }
  }, [groupsMessagesData]);

  const scrollRef = useRef(null);

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup || !user) return;

    try {
      await sendGroupMessage({
        groupId: activeGroup?.id,
        userId: user?.id,
        senderId: user.id,
        content: newMessage,
      }).unwrap();

      setNewMessage("");
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  const myMembership = pendingGroup?.members?.find(
    (m: any) => m?.user?.id === user?.id
  );

  const canAcceptInvite =
    myMembership?.status === groupJoinStatusTypes.MEMBER_JOINING_PENDING;

  if (usersLoading || groupsLoading) return <Loading />;

  return (
    <div className="container mx-auto min-h-screen p-4 sm:p-8">
      <PageHeader
        title="Group Chats & Communities"
        description="Join Communities and Start Chatting with like-minded members."
        actionTitle={"Single Chats"}
        Icon={MessageCircle}
        onAction={() => router.push("/dashboard/chat")}
        loading={false}
        disabled={false}
        second={false}
        actionTitle2=""
        onAction2={() => console.log("Second Action")}
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
              .map((group) => {
                const membersCount = group.members.length || 0;
                const myStatus: any = group?.myMembership?.status ?? "approved";
                const statusUI =
                  GROUP_STATUS_UI[
                    String(myStatus) as keyof typeof GROUP_STATUS_UI
                  ];

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      if (statusUI?.clickable) {
                        setActiveGroup(group);
                      } else {
                        setPendingGroup(group);
                        setShowGroupStatusModal(true);
                      }
                    }}
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
                        {membersCount} Members •{" "}
                        {group.lastMessage || "No messages"}
                      </p>
                    </div>
                    {activeGroup?.id === group.id && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {statusUI && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusUI.color}`}
                        >
                          {statusUI.label}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
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
                  {activeGroup?.createdBy?.id === user?.id && (
                    <button
                      onClick={() => setShowManageMembersModal(true)}
                      className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                  <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
                    <Info className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FDFDFF]">
                {messages &&
                  !groupsMessagesLoading &&
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id || i + 1}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        } group animate-in fade-in slide-in-from-bottom-2`}
                      >
                        <div className={`max-w-[70%] ${isMe ? "order-2" : ""}`}>
                          {!isMe && (
                            <p className="text-[10px] font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                              {msg.sender?.firstName} {msg.sender?.lastName}
                            </p>
                          )}
                          <div
                            className={`px-5 py-3 rounded-2xl text-sm shadow-sm ${
                              isMe
                                ? "bg-primary text-white rounded-tr-none"
                                : "bg-white border border-gray-100 text-gray-700 rounded-tl-none"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <p
                            className={`text-[9px] mt-1.5 text-gray-400 ${
                              isMe ? "text-right mr-1" : "ml-1"
                            }`}
                          >
                            {new Date(
                              msg.createdAt ?? new Date()
                            ).toLocaleTimeString([], {
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
                    className="flex-1 bg-transparent border-none outline-none text-sm px-4 py-2"
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

        {showCreateModal && (
          <CreateGroupChat
            setShowCreateModal={setShowCreateModal}
            user={user}
            members={members || []}
            source="chat"
            groupRefetching={groupRefetching}
          />
        )}

        {showGroupStatusModal && pendingGroup && (
          <Modal onClose={() => setShowGroupStatusModal(false)}>
            {pendingGroup.members[0].status ===
              groupJoinStatusTypes.ADMIN_APPROVAL_PENDING && (
              <>
                <h3 className="text-lg font-bold">Approval pending</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your request to join <b>{pendingGroup.name}</b> is waiting for
                  admin approval.
                </p>
              </>
            )}

            {canAcceptInvite && (
              <>
                <h3 className="text-lg font-bold">Group invitation</h3>
                <p className="text-sm text-gray-600 mt-2">
                  You’ve been invited to join <b>{pendingGroup.name}</b>.
                </p>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={async () => {
                      await acceptGroupInvitation({
                        groupId: pendingGroup.id,
                        userId: user?.id,
                      }).unwrap();
                      groupRefetching();
                      setShowGroupStatusModal(false);
                    }}
                    className="bg-primary py-2 px-6 rounded-full text-white hover:bg-primary/80"
                  >
                    Accept
                  </button>
                  <button
                    onClick={async () => {
                      await declineGroupInvitation({
                        groupId: pendingGroup.id,
                        userId: user?.id,
                      }).unwrap();
                      groupRefetching();
                      setShowGroupStatusModal(false);
                    }}
                    className="bg-white py-2 px-6 rounded-full text-primary hover:bg-primary hover:text-white border-2 border-primary"
                  >
                    Decline
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}

        {showManageMembersModal && activeGroup && (
          <Modal onClose={() => setShowManageMembersModal(false)}>
            <h3 className="text-lg font-bold mb-4">Manage Members</h3>

            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-2">
                Join requests ({joinRequests.length})
              </h4>

              {joinRequests.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  No pending requests
                </p>
              )}

              <div className="space-y-2">
                {joinRequests.map((m: any) => (
                  <div
                    key={m?.user?.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="text-sm font-medium">
                      {m?.user?.firstName} {m?.user?.lastName}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await approveGroupJoinRequest({
                              groupId: activeGroup.id,
                              userId: m?.user?.id,
                            }).unwrap();
                            toastSuccess(
                              `You have approved ${m?.user?.firstName}'s request to join group ${activeGroup?.name}!`
                            );
                            groupRefetching();
                          } catch (error) {
                            console.log(error);
                            toastError(
                              "Approving join request did not work. Try again!"
                            );
                          }
                        }}
                        className="px-3 py-1 text-xs rounded-full bg-green-600 text-white hover:bg-green-700"
                      >
                        Approve
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await rejectJoinRequest({
                              groupId: activeGroup.id,
                              userId: m?.user?.id,
                            }).unwrap();
                            toastSuccess(
                              `You have rejected ${m?.user?.firstName}'s request to join group ${activeGroup?.name}!`
                            );
                            groupRefetching();
                          } catch (error) {
                            console.log(error);
                            toastError(
                              "Rejecting join request did not work. Try again!"
                            );
                          }
                        }}
                        className="px-3 py-1 text-xs rounded-full bg-red-600 text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">
                Invite members
              </h4>

              <input
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder="Search users by name..."
                className="w-full px-3 py-2 mb-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
              />

              <div className="max-h-56 overflow-y-auto space-y-2">
                {inviteCandidates.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No users found</p>
                )}

                {inviteCandidates.map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <span className="text-sm">
                      {u.firstName} {u.lastName}
                    </span>

                    <button
                      onClick={async () => {
                        try {
                          await addNewGroupMember({
                            groupId: activeGroup.id,
                            userId: u.id,
                          });
                          toastSuccess(
                            `You have invited ${u?.firstName} to join group ${activeGroup?.name}!`
                          );
                          groupRefetching();
                        } catch (error) {
                          console.log(error);
                          toastError(
                            "Inviting to join group did not work. Try again!"
                          );
                        }
                      }}
                      className="px-3 py-1 text-xs rounded-full border border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
