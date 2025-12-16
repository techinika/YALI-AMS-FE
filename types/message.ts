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
