import React, { useRef, useEffect, useState } from 'react';

const PRESET_COLORS = [
  { name: 'Dark', color: '#0f172a' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Purple', color: '#7c3aed' },
  { name: 'Green', color: '#059669' },
  { name: 'Red', color: '#dc2626' },
  { name: 'Orange', color: '#d97706' },
  { name: 'Gray', color: '#64748b' },
];

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Type description here...',
  rows = 4,
  id,
  className = '',
  style = {}
}) {
  const editorRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState('#2563eb');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Synchronize incoming value with contentEditable innerHTML when value changes from parent
  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const targetHtml = value || '';
      if (currentHtml !== targetHtml) {
        editorRef.current.innerHTML = targetHtml;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.innerHTML;
      if (html === '<br>' || html === '<div><br></div>' || html.trim() === '') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  };

  const executeCommand = (command, val = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, val);
      handleInput();
    }
  };

  const handleBold = (e) => {
    e.preventDefault();
    executeCommand('bold');
  };

  const handleItalic = (e) => {
    e.preventDefault();
    executeCommand('italic');
  };

  const handleUnderline = (e) => {
    e.preventDefault();
    executeCommand('underline');
  };

  const handleHeading = (e) => {
    e.preventDefault();
    executeCommand('formatBlock', '<h3>');
  };

  const handleList = (e) => {
    e.preventDefault();
    executeCommand('insertUnorderedList');
  };

  const handleClear = (e) => {
    e.preventDefault();
    executeCommand('removeFormat');
  };

  const handleApplyColor = (colorHex, e) => {
    if (e) e.preventDefault();
    setSelectedColor(colorHex);
    executeCommand('foreColor', colorHex);
  };

  const handleFontSize = (sizeVal, e) => {
    e.preventDefault();
    executeCommand('fontSize', sizeVal);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        executeCommand('bold');
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        executeCommand('italic');
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        executeCommand('underline');
      }
    }
  };

  const minHeightPx = Math.max(90, rows * 24);

  return (
    <div className={`rich-editor-box ${className}`} style={style}>
      <div className="rich-editor-header">
        <div className="rich-editor-tools">
          <button
            type="button"
            className="rich-tool-btn"
            onMouseDown={handleBold}
            title="Bold selected text (Ctrl+B)"
          >
            <i className="fa-solid fa-bold"></i> <span>Bold</span>
          </button>

          <button
            type="button"
            className="rich-tool-btn"
            onMouseDown={handleItalic}
            title="Italicize selected text (Ctrl+I)"
          >
            <i className="fa-solid fa-italic"></i> <span>Italic</span>
          </button>

          <button
            type="button"
            className="rich-tool-btn"
            onMouseDown={handleUnderline}
            title="Underline selected text (Ctrl+U)"
          >
            <i className="fa-solid fa-underline"></i> <span>Underline</span>
          </button>

          <div className="rich-tool-divider"></div>

          {/* Text Size Controls */}
          <div className="rich-tool-group" title="Text Size">
            <button
              type="button"
              className="rich-tool-btn size-btn"
              onMouseDown={(e) => handleFontSize('2', e)}
              title="Small Text"
            >
              A<sub style={{ fontSize: '9px' }}>-</sub>
            </button>
            <button
              type="button"
              className="rich-tool-btn size-btn"
              onMouseDown={(e) => handleFontSize('3', e)}
              title="Normal Text"
            >
              A
            </button>
            <button
              type="button"
              className="rich-tool-btn size-btn"
              onMouseDown={(e) => handleFontSize('5', e)}
              title="Large Text"
            >
              A<sup style={{ fontSize: '9px' }}>+</sup>
            </button>
          </div>

          <div className="rich-tool-divider"></div>

          {/* Text Color Selection */}
          <div className="rich-color-palette">
            <span className="color-label"><i className="fa-solid fa-palette"></i> Color:</span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.color}
                type="button"
                className="color-dot-btn"
                style={{ backgroundColor: c.color }}
                title={`Change text color to ${c.name}`}
                onMouseDown={(e) => handleApplyColor(c.color, e)}
              />
            ))}
            
            {/* Custom Color Input */}
            <label className="custom-color-picker-wrapper" title="Pick Custom Color">
              <i className="fa-solid fa-eye-dropper" style={{ color: selectedColor }}></i>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleApplyColor(e.target.value)}
                className="custom-color-input"
              />
            </label>
          </div>

          <div className="rich-tool-divider"></div>

          <button
            type="button"
            className="rich-tool-btn"
            onMouseDown={handleHeading}
            title="Make Heading"
          >
            <i className="fa-solid fa-heading"></i> <span>Heading</span>
          </button>

          <button
            type="button"
            className="rich-tool-btn"
            onMouseDown={handleList}
            title="Bullet list"
          >
            <i className="fa-solid fa-list-ul"></i> <span>List</span>
          </button>

          <button
            type="button"
            className="rich-tool-btn clear-btn"
            onMouseDown={handleClear}
            title="Clear formatting on selected text"
          >
            <i className="fa-solid fa-eraser"></i> <span>Clear</span>
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        id={id}
        contentEditable={true}
        className="rich-editor-contenteditable"
        style={{ minHeight: `${minHeightPx}px` }}
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}
