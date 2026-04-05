import { IconType } from "react-icons";
import { GoBlocked } from "react-icons/go";

export const PageHeader = ({
  title,
  description,
  actionTitle,
  Icon,
  onAction,
  loading,
  disabled,
  second = false,
  onAction2,
  loading2,
  disabled2,
  actionTitle2,
  Icon2,
}: {
  title: string;
  description?: string;
  actionTitle: string;
  Icon: IconType;
  onAction?: () => void;
  loading: boolean;
  disabled: boolean;
  second: boolean;
  onAction2?: () => void;
  loading2: boolean;
  disabled2: boolean;
  actionTitle2: string;
  Icon2: IconType;
}) => (
  <div className="flex justify-between items-center mb-6 border-b pb-4">
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
      <p className="text-gray-500 mt-1">{description} </p>
    </div>{" "}
    <div className="flex items-center gap-2">
      <button
        onClick={onAction}
        disabled={disabled || loading}
        className={`flex items-center text-white font-semibold py-2 px-4 rounded shadow-md transition-colors ${
          disabled ? "bg-gray-600" : "bg-primary hover:bg-primary/70"
        }`}
      >
        {disabled ? null : (
          <div>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Icon className="w-5 h-5 mr-2" />
            )}
          </div>
        )}
        {disabled ? <GoBlocked /> : actionTitle}
      </button>
      {second && (
        <button
          onClick={onAction2}
          disabled={disabled2 || loading2}
          className={`flex items-center text-primary font-semibold py-2 px-4 rounded shadow-md transition-colors ${
            disabled ? "bg-gray-600" : "bg-white hover:bg-gray-100"
          }`}
        >
          {disabled2 ? null : (
            <div>
              {loading2 ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Icon2 className="w-5 h-5 mr-2" />
              )}
            </div>
          )}
          {disabled2 ? <GoBlocked /> : actionTitle2}
        </button>
      )}
    </div>
  </div>
);
