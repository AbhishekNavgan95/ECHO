import { DiffEditor, Editor } from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';

const EditorComponent = ({
  language,
  code,
  editorType = 'simple',
  onChange = () => {},
  readOnly = false,
}) => {
  const [prevCode, setPrevCode] = useState('');

  // Set initial previous code only once when entering diff mode
  useEffect(() => {
    if (editorType === 'diff') {
      setPrevCode((prev) => prev || code);
    }
  }, [editorType, code]);

  return (
    <div className="flex items-start gap-x-3 w-full col-span-10 border-4 border-richblack-500 rounded-md overflow-hidden">
      {editorType === 'diff' ? (
        <DiffEditor
          height="100vh"
          theme="vs-dark"
          className="flex-1 outline-none"
          language={language}
          original={prevCode}
          onChange={onChange}
          modified={code}
          options={{
            renderSideBySide: true,
            minimap: { enabled: true },
            automaticLayout: true,
            fontSize: 16,
          }}
        />
      ) : (
        <Editor
          height="100%"
          theme="vs-dark"
          className="flex-1"
          language={language}
          value={code}
          onChange={onChange}
          options={{
            readOnly,
            fontSize: 16,
            minimap: { enabled: true },
            automaticLayout: true,
            acceptSuggestionOnEnter: true,
            autoClosingBrackets: true,
            cursorSmoothCaretAnimation: true,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            scrollBeyondLastLine: true,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            wordWrapBreakAfterCharacters:
              '\t\r\n!#%&()*+,-./:;<=>?@[\\]^`{|}~ ',
          }}
        />
      )}
    </div>
  );
};

export default EditorComponent;
