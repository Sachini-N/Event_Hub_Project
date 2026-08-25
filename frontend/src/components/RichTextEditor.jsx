import React, { useRef, useEffect, useState } from 'react';

const EMOJI_LIST = ['😀', '😂', '😍', '🎉', '🚀', '🔥', '💡', '✨', '🎯', '📌', '📅', '👍', '❤️', '💼', '🏆', '⭐'];

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Type / for menu',
  rows = 4,
  id,
  className = '',
  style = {},
}) {
  const editorRef = useRef(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Sync value from props to editor innerHTML
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

  const executeCommand = (command, e, val = null) => {
    if (e) e.preventDefault();
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, val);
      handleInput();
    }
  };

  const handleKeyDown = (e) => {
    // Check if user types '/' at beginning or empty line to open menu
    if (e.key === '/') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const textBefore = sel.anchorNode?.textContent || '';
        if (textBefore.trim() === '' || textBefore.endsWith(' ')) {
          setShowSlashMenu(true);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setShowEmojiPicker(false);
      setShowLinkModal(false);
    }
  };

  const handleInsertEmoji = (emoji, e) => {
    executeCommand('insertText', e, emoji);
    setShowEmojiPicker(false);
  };

  const handleAddLink = (e) => {
    if (e) e.preventDefault();
    if (linkUrl.trim()) {
      executeCommand('createLink', null, linkUrl.trim());
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  const handleSlashItemClick = (type, e) => {
    if (e) e.preventDefault();
    setShowSlashMenu(false);

    // Remove slash character if recently typed
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (range.startOffset > 0 && range.startContainer.textContent[range.startOffset - 1] === '/') {
        range.setStart(range.startContainer, range.startOffset - 1);
        range.deleteContents();
      }
    }

    if (type === 'h1') executeCommand('formatBlock', null, '<h3>');
    else if (type === 'h2') executeCommand('formatBlock', null, '<h4>');
    else if (type === 'ul') executeCommand('insertUnorderedList', null);
    else if (type === 'ol') executeCommand('insertOrderedList', null);
    else if (type === 'quote') executeCommand('formatBlock', null, '<blockquote>');
    else if (type === 'hr') executeCommand('insertHorizontalRule', null);
  };

  const minHeightPx = Math.max(90, rows * 24);

  return (
    <div className={`rich-editor-notion-container ${className}`} style={style}>
      {/* Top Content Editable Area */}
      <div
        ref={editorRef}
        id={id}
        contentEditable={true}
        className="rich-editor-notion-editable"
        style={{ minHeight: `${minHeightPx}px` }}
        data-placeholder={placeholder || 'Type / for menu'}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning={true}
      />

      {/* Slash Menu Popup */}
      {showSlashMenu && (
        <div className="slash-menu-dropdown">
          <div className="slash-menu-header">Basic Blocks</div>
          <button type="button" className="slash-menu-item" onMouseDown={(e) => handleSlashItemClick('h1', e)}>
            <i className="fa-solid fa-heading" style={{ color: '#5d4df6' }}></i>
            <div>
              <strong>Heading 1</strong>
              <span>Large section title</span>
            </div>
          </button>
          <button type="button" className="slash-menu-item" onMouseDown={(e) => handleSlashItemClick('h2', e)}>
            <i className="fa-solid fa-h" style={{ color: '#2563eb' }}></i>
            <div>
              <strong>Heading 2</strong>
              <span>Medium subsection header</span>
            </div>
          </button>
          <button type="button" className="slash-menu-item" onMouseDown={(e) => handleSlashItemClick('ul', e)}>
            <i className="fa-solid fa-list-ul" style={{ color: '#059669' }}></i>
            <div>
              <strong>Bulleted List</strong>
              <span>Create a bulleted list</span>
            </div>
          </button>
          <button type="button" className="slash-menu-item" onMouseDown={(e) => handleSlashItemClick('ol', e)}>
            <i className="fa-solid fa-list-ol" style={{ color: '#d97706' }}></i>
            <div>
              <strong>Numbered List</strong>
              <span>Create an ordered list</span>
            </div>
          </button>
          <button type="button" className="slash-menu-item" onMouseDown={(e) => handleSlashItemClick('quote', e)}>
            <i className="fa-solid fa-quote-left" style={{ color: '#7c3aed' }}></i>
            <div>
              <strong>Quote</strong>
              <span>Capture a quote or highlight</span>
            </div>
          </button>
          <button type="button" className="slash-menu-item" onMouseDown={(e) => handleSlashItemClick('hr', e)}>
            <i className="fa-solid fa-minus" style={{ color: '#64748b' }}></i>
            <div>
              <strong>Divider</strong>
              <span>Visually divide content</span>
            </div>
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="emoji-picker-dropdown">
          <div className="emoji-grid">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="emoji-btn"
                onMouseDown={(e) => handleInsertEmoji(emoji, e)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Link Input Popover */}
      {showLinkModal && (
        <div className="link-input-popover">
          <input
            type="url"
            placeholder="Paste or type link URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddLink(e)}
            autoFocus
          />
          <button type="button" className="btn-link-save" onMouseDown={handleAddLink}>
            Add Link
          </button>
        </div>
      )}

      {/* Bottom Floating Action Toolbar (Matching Reference Screenshot) */}
      <div className="notion-bottom-toolbar">
        {/* Plus Button for Menu */}
        <button
          type="button"
          className="notion-btn-plus"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowSlashMenu((prev) => !prev);
          }}
          title="Add block or menu (/)"
        >
          +
        </button>

        <div className="notion-toolbar-divider"></div>

        {/* Format Action Buttons */}
        <button
          type="button"
          className="notion-tool-btn"
          onMouseDown={(e) => executeCommand('bold', e)}
          title="Bold (Ctrl+B)"
        >
          <span style={{ fontWeight: '800', fontFamily: 'serif' }}>B</span>
        </button>

        <button
          type="button"
          className="notion-tool-btn"
          onMouseDown={(e) => executeCommand('italic', e)}
          title="Italic (Ctrl+I)"
        >
          <span style={{ fontStyle: 'italic', fontFamily: 'serif' }}>I</span>
        </button>

        <button
          type="button"
          className="notion-tool-btn"
          onMouseDown={(e) => executeCommand('underline', e)}
          title="Underline (Ctrl+U)"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>

        <button
          type="button"
          className="notion-tool-btn"
          onMouseDown={(e) => executeCommand('strikethrough', e)}
          title="Strikethrough"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>

        <button
          type="button"
          className="notion-tool-btn"
          onMouseDown={(e) => executeCommand('insertUnorderedList', e)}
          title="Bulleted List"
        >
          <i className="fa-solid fa-list-ul"></i>
        </button>

        <button
          type="button"
          className="notion-tool-btn"
          onMouseDown={(e) => executeCommand('insertOrderedList', e)}
          title="Numbered List"
        >
          <i className="fa-solid fa-list-ol"></i>
        </button>

        <button
          type="button"
          className="notion-tool-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowLinkModal((prev) => !prev);
          }}
          title="Insert Link"
        >
          <i className="fa-solid fa-link"></i>
        </button>

        <div className="notion-toolbar-divider"></div>

        <button
          type="button"
          className="notion-tool-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowEmojiPicker((prev) => !prev);
          }}
          title="Insert Emoji"
        >
          <i className="fa-regular fa-face-smile"></i>
        </button>
      </div>
    </div>
  );
}
