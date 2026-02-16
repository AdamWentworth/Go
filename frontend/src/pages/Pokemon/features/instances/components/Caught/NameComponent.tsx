// NameComponent.tsx
import React, { useState, useRef, useEffect } from 'react';
import './NameComponent.css';
import { getLastWord } from '@/utils/formattingHelpers';

interface Pokemon {
  name: string;
  instanceData: {
    nickname?: string;
  };
}

interface NameComponentProps {
  pokemon: Pokemon;
  editMode: boolean;
  onNicknameChange: (nickname: string | null) => void;
}

const NameComponent: React.FC<NameComponentProps> = ({ pokemon, editMode, onNicknameChange }) => {
  const initialNickname = (): string =>
    pokemon.instanceData.nickname && pokemon.instanceData.nickname.trim() !== ''
      ? pokemon.instanceData.nickname
      : '';

  const [nickname, setNicknameState] = useState<string>(initialNickname());
  const [userFocus, setUserFocus] = useState<boolean>(false);
  const editableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNicknameState(initialNickname());
  }, [pokemon.instanceData.nickname, pokemon.name]);

  useEffect(() => {
    if (editMode && editableRef.current) {
      const defaultName = getLastWord(pokemon.name);
      const displayName = nickname || defaultName;
      // Update textContent when entering edit mode or when nickname is non-empty
      if (!userFocus) {
        editableRef.current.textContent = displayName as string | null;
      }
      if (userFocus) {
        setCaretToEnd();
      }
    }
  }, [editMode, nickname, pokemon.name, userFocus]);

  const setCaretToEnd = () => {
    if (editableRef.current) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editableRef.current.focus();
    }
  };

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const newValue = event.currentTarget.textContent?.trim() ?? '';
    if (newValue === '') {
      setNicknameState('');
      onNicknameChange(null);
    } else if (validateNickname(newValue)) {
      setNicknameState(newValue);
      onNicknameChange(newValue);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editableRef.current?.blur();
      setUserFocus(false);
    }
  };

  const validateNickname = (input: string): boolean => input.length <= 12;

  useEffect(() => {
    if (!editMode) {
      setUserFocus(false);
    }
  }, [editMode]);

  return (
    <div className="name-container">
      <div className="name-display">
        <div className="name-center-content">
          {editMode ? (
            <span
              contentEditable={editMode}
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onClick={() => setUserFocus(true)}
              onTouchStart={() => setUserFocus(true)}
              ref={editableRef}
              className={`name-editable-content ${editMode ? 'editable' : ''}`}
            >
              {nickname}
            </span>
          ) : (
            <span className="name-editable-content">
              {nickname || getLastWord(pokemon.name)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NameComponent;