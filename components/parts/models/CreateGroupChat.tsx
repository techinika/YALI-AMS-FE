import { useAddNewGroupMutation } from "@/lib/features/chatSlice";
import { toastError, toastSuccess } from "@/lib/toast";
import { Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";

function CreateGroupChat({
  setShowCreateModal,
  user,
  members = [],
  source = "ai",
  groupRefetching,
}: {
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  user: any;
  members: any[];
  source: string;
  groupRefetching?: any;
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addNewGroup] = useAddNewGroupMutation();

  useEffect(() => {
    if (source === "ai" && members && members.length > 0) {
      setSelectedMembers(members);
    }
  }, [source, members]);

  const handleCreateGroup = async () => {
    setIsSubmitting(true);
    if (!newGroupName.trim() || !user) return;
    try {
      const membersToAdd = selectedMembers.length
        ? selectedMembers.map((m) => m.id)
        : [];
      console.log(membersToAdd);
      const newGroupData = {
        name: newGroupName,
        createdBy: user.id,
        memberIds: membersToAdd,
        interests: source === "ai" ? "AI Match" : "Manual Creation",
      };

      await addNewGroup(newGroupData).unwrap();

      toastSuccess("Group created successfully!");

      setShowCreateModal(false);
      setNewGroupName("");
      setSelectedMembers([]);
      groupRefetching();
    } catch (err) {
      console.error("Create Group Error:", err);
      toastError(
        "Failed to create group. Please try again or contact support."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMemberSelection = (member: any) => {
    setSelectedMembers((prev) =>
      prev.find((m) => m.id === member.id)
        ? prev.filter((m) => m.id !== member.id)
        : [...prev, member]
    );
  };

  return (
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
              <label
                htmlFor="user"
                className="text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Select Members
              </label>
              <span className="text-[10px] font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                {selectedMembers.length} Selected
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {members.map((member: any) => {
                const isSelected = selectedMembers.find(
                  (m: any) => m.id === member.id
                );
                if (member.id === user.id) return null;
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold mr-3`}
                    >
                      {member.firstName.charAt(0)}
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-xs font-bold text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500">Member</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-gray-200"
                      }`}
                    >
                      {isSelected && <Plus className="w-3 h-3 rotate-45" />}
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
            className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 rounded-xl hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim()}
            className="px-8 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/80 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Creating Group..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupChat;
