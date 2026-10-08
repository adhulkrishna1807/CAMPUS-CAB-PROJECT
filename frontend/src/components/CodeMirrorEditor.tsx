'use client';

import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeMirrorEditorProps {
  value: string;
  language: 'python' | 'c' | 'cpp';
  onChange: (val: string) => void;
  className?: string;
}

export default function CodeMirrorEditor({
  value,
  language,
  onChange,
  className = '',
}: CodeMirrorEditorProps) {
  const getExtension = () => {
    if (language === 'python') {
      return [python()];
    }
    // C and C++ both use cpp language support
    return [cpp()];
  };

  return (
    <div className={`h-full w-full overflow-hidden text-sm font-mono ${className}`}>
      <CodeMirror
        value={value}
        height="100%"
        theme={oneDark}
        extensions={getExtension()}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        className="h-full overflow-auto [&_.cm-editor]:h-full [&_.cm-scroller]:h-full font-mono text-[13px] sm:text-sm"
      />
    </div>
  );
}
