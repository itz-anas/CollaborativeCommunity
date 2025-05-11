import { useEffect, useRef } from "react";

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function DocumentEditor({ content, onChange }: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Initialize the editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    // Make the div editable
    editor.contentEditable = "true";
    editor.innerHTML = content;
    
    // Focus the editor
    editor.focus();
    
    // Set cursor at the end
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Set up event listener for input changes
    const handleInput = () => {
      if (editor) {
        onChange(editor.innerHTML);
      }
    };
    
    editor.addEventListener("input", handleInput);
    
    return () => {
      editor.removeEventListener("input", handleInput);
    };
  }, []);
  
  // Update editor content if content prop changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.innerHTML === content) return;
    
    // Only update if the content is different to avoid cursor position reset
    if (editor !== document.activeElement) {
      editor.innerHTML = content;
    }
  }, [content]);
  
  // Helper function to format text
  const formatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    
    // Update the content state after formatting
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("bold")}
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("italic")}
          title="Italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("underline")}
          title="Underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
            <line x1="4" y1="21" x2="20" y2="21" />
          </svg>
        </button>
        <span className="border-r border-gray-300 h-6 mx-1"></span>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("formatBlock", "<h1>")}
          title="Heading 1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
          </svg>
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("formatBlock", "<h2>")}
          title="Heading 2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M15 10h5l-5 8h5" />
          </svg>
        </button>
        <span className="border-r border-gray-300 h-6 mx-1"></span>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("insertUnorderedList")}
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("insertOrderedList")}
          title="Numbered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </button>
        <span className="border-r border-gray-300 h-6 mx-1"></span>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("justifyLeft")}
          title="Align Left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="17" y1="10" x2="3" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="17" y1="18" x2="3" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => formatText("justifyCenter")}
          title="Align Center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="10" x2="6" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="18" y1="18" x2="6" y2="18" />
          </svg>
        </button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[300px] p-4 prose max-w-none focus:outline-none"
        onBlur={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
      />
    </div>
  );
}
