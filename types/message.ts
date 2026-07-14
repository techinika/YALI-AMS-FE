import { Member } from "./user";

export interface Message {
  id: string;
  message: string;
  sender: Member;
  receiverId: string;
  receiver: Member;
  senderId: string;
  createdAt: string;
  public: boolean;
}

export interface GroupMessage {
  id: string;
  content: string;
  sender: Member;
  senderId: string;
  groupId: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  createdBy: Member;
  createdAt: string;
  lastMessage: string;
  myMembership?: {
    id?: string;
    status: string;
    joinedAt?: string;
  };
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  status: string;
  user: Member;
  joinedAt: string;
}

export const groupJoinStatusTypes = {
  ADMIN_APPROVAL_PENDING: "admin_approval_pending",
  MEMBER_JOINING_PENDING: "member_joining_pending",
  ADMIN_REJECTED: "admin_rejected",
  MEMBER_LEFT: "member_left",
  MEMBER_REJECTED: "member_rejected",
  APPROVED: "approved",
};

export const GROUP_STATUS_UI = {
  approved: {
    label: "Member",
    color: "bg-green-100 text-green-700",
    clickable: true,
  },
  admin_approval_pending: {
    label: "Pending approval",
    color: "bg-yellow-100 text-yellow-700",
    clickable: false,
  },
  member_joining_pending: {
    label: "Invitation",
    color: "bg-blue-100 text-blue-700",
    clickable: false,
  },
  admin_rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    clickable: false,
  },
};
