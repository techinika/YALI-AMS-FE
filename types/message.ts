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
}
