import { useRef } from "react";

const RichTextEditor = ({
  message,
  setMessage,
}: {
  message: string;
  setMessage: (v: string) => void;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const format = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    const url = prompt("Enter URL:");
    if (!url) return;
    format("createLink", url);
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2 border p-2 rounded-lg bg-gray-50">
        <button
          type="button"
          onClick={() => format("bold")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => format("italic")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200 italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => format("underline")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200 underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={addLink}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200 text-blue-600"
        >
          Link
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        dangerouslySetInnerHTML={{ __html: message }}
        onInput={handleInput}
        className="w-full p-3 border border-gray-300 rounded-lg h-40 resize-y overflow-auto focus:ring-primary focus:border-primary transition duration-150"
      ></div>
    </div>
  );
};

export default RichTextEditor;
