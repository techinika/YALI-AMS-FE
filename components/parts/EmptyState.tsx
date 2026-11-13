import { MdPeopleOutline, MdSentimentDissatisfied } from "react-icons/md";

export const EmptyState = ({ isFiltered }: { isFiltered: boolean }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 mt-3">
    {isFiltered ? (
      <>
        <MdSentimentDissatisfied className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Members Found</h3>
        <p className="text-center max-w-sm">
          Your current search or filter criteria returned no results. Try
          adjusting your filters or clearing the search bar.
        </p>
      </>
    ) : (
      <>
        <MdPeopleOutline className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Member List is Empty</h3>
        <p className="text-center max-w-sm">
          It looks like no users have been added yet. Click the &ldquo;Invite New
          User&rdquo; button above to get started!
        </p>
      </>
    )}
  </div>
);
