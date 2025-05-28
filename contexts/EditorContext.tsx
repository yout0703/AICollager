'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { CollageElement, CanvasConfig } from '@/types/collage';

// 编辑器命令类型
export interface EditorCommand {
  type: 'move' | 'resize' | 'rotate' | 'add' | 'delete' | 'modify' | 'reorder';
  elementId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
}

// 编辑器状态接口
export interface EditorState {
  canvas: CanvasConfig;
  elements: CollageElement[];
  selectedElementId: string | null;
  history: EditorCommand[];
  historyIndex: number;
  isDirty: boolean; // 是否有未保存的更改
  isLoading: boolean;
  error: string | null;
  clipboard: CollageElement | null; // 剪贴板
}

// 编辑器动作类型
type EditorAction = 
  | { type: 'SET_CANVAS'; payload: CanvasConfig }
  | { type: 'SET_ELEMENTS'; payload: CollageElement[] }
  | { type: 'ADD_ELEMENT'; payload: CollageElement }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; changes: Partial<CollageElement> } }
  | { type: 'DELETE_ELEMENT'; payload: string }
  | { type: 'SELECT_ELEMENT'; payload: string | null }
  | { type: 'REORDER_ELEMENT'; payload: { id: string; newIndex: number } }
  | { type: 'EXECUTE_COMMAND'; payload: EditorCommand }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'COPY_ELEMENT'; payload: string }
  | { type: 'PASTE_ELEMENT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'MARK_CLEAN' };

// 初始状态
const initialState: EditorState = {
  canvas: {
    width: 800,
    height: 600,
    aspectRatio: '4:3',
    backgroundColor: '#ffffff',
    padding: 20
  },
  elements: [],
  selectedElementId: null,
  history: [],
  historyIndex: -1,
  isDirty: false,
  isLoading: false,
  error: null,
  clipboard: null
};

// Reducer 函数
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_CANVAS':
      return {
        ...state,
        canvas: action.payload,
        isDirty: true
      };

    case 'SET_ELEMENTS':
      return {
        ...state,
        elements: action.payload,
        isDirty: true
      };

    case 'ADD_ELEMENT': {
      const newElements = [...state.elements, action.payload];
      const command: EditorCommand = {
        type: 'add',
        elementId: action.payload.id,
        newValue: action.payload,
        timestamp: Date.now()
      };
      
      return {
        ...state,
        elements: newElements,
        selectedElementId: action.payload.id,
        history: [...state.history.slice(0, state.historyIndex + 1), command],
        historyIndex: state.historyIndex + 1,
        isDirty: true
      };
    }

    case 'UPDATE_ELEMENT': {
      const elementIndex = state.elements.findIndex(el => el.id === action.payload.id);
      if (elementIndex === -1) return state;

      const oldElement = state.elements[elementIndex];
      const newElement = { ...oldElement, ...action.payload.changes } as CollageElement;
      const newElements = [...state.elements];
      newElements[elementIndex] = newElement;

      const command: EditorCommand = {
        type: 'modify',
        elementId: action.payload.id,
        oldValue: oldElement,
        newValue: newElement,
        timestamp: Date.now()
      };

      return {
        ...state,
        elements: newElements,
        history: [...state.history.slice(0, state.historyIndex + 1), command],
        historyIndex: state.historyIndex + 1,
        isDirty: true
      };
    }

    case 'DELETE_ELEMENT': {
      const elementIndex = state.elements.findIndex(el => el.id === action.payload);
      if (elementIndex === -1) return state;

      const deletedElement = state.elements[elementIndex];
      const newElements = state.elements.filter(el => el.id !== action.payload);

      const command: EditorCommand = {
        type: 'delete',
        elementId: action.payload,
        oldValue: deletedElement,
        timestamp: Date.now()
      };

      return {
        ...state,
        elements: newElements,
        selectedElementId: state.selectedElementId === action.payload ? null : state.selectedElementId,
        history: [...state.history.slice(0, state.historyIndex + 1), command],
        historyIndex: state.historyIndex + 1,
        isDirty: true
      };
    }

    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: action.payload
      };

    case 'REORDER_ELEMENT': {
      const elementIndex = state.elements.findIndex(el => el.id === action.payload.id);
      if (elementIndex === -1) return state;

      const element = state.elements[elementIndex];
      const newElements = [...state.elements];
      newElements.splice(elementIndex, 1);
      newElements.splice(action.payload.newIndex, 0, element);

      const command: EditorCommand = {
        type: 'reorder',
        elementId: action.payload.id,
        oldValue: elementIndex,
        newValue: action.payload.newIndex,
        timestamp: Date.now()
      };

      return {
        ...state,
        elements: newElements,
        history: [...state.history.slice(0, state.historyIndex + 1), command],
        historyIndex: state.historyIndex + 1,
        isDirty: true
      };
    }

    case 'UNDO': {
      if (state.historyIndex < 0) return state;

      const command = state.history[state.historyIndex];
      let newElements = [...state.elements];

      switch (command.type) {
        case 'add':
          newElements = newElements.filter(el => el.id !== command.elementId);
          break;
        case 'delete':
          newElements.push(command.oldValue);
          break;
        case 'modify':
          const modifyIndex = newElements.findIndex(el => el.id === command.elementId);
          if (modifyIndex !== -1) {
            newElements[modifyIndex] = command.oldValue;
          }
          break;
        case 'reorder':
          const reorderIndex = newElements.findIndex(el => el.id === command.elementId);
          if (reorderIndex !== -1) {
            const element = newElements[reorderIndex];
            newElements.splice(reorderIndex, 1);
            newElements.splice(command.oldValue, 0, element);
          }
          break;
      }

      return {
        ...state,
        elements: newElements,
        historyIndex: state.historyIndex - 1,
        isDirty: true
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;

      const command = state.history[state.historyIndex + 1];
      let newElements = [...state.elements];

      switch (command.type) {
        case 'add':
          newElements.push(command.newValue);
          break;
        case 'delete':
          newElements = newElements.filter(el => el.id !== command.elementId);
          break;
        case 'modify':
          const modifyIndex = newElements.findIndex(el => el.id === command.elementId);
          if (modifyIndex !== -1) {
            newElements[modifyIndex] = command.newValue;
          }
          break;
        case 'reorder':
          const reorderIndex = newElements.findIndex(el => el.id === command.elementId);
          if (reorderIndex !== -1) {
            const element = newElements[reorderIndex];
            newElements.splice(reorderIndex, 1);
            newElements.splice(command.newValue, 0, element);
          }
          break;
      }

      return {
        ...state,
        elements: newElements,
        historyIndex: state.historyIndex + 1,
        isDirty: true
      };
    }

    case 'COPY_ELEMENT': {
      const element = state.elements.find(el => el.id === action.payload);
      if (!element) return state;

      return {
        ...state,
        clipboard: element
      };
    }

    case 'PASTE_ELEMENT': {
      if (!state.clipboard) return state;

      // 使用深拷贝并生成新ID
      const newElement = JSON.parse(JSON.stringify(state.clipboard)) as CollageElement;
      newElement.id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      newElement.transform.x += 20;
      newElement.transform.y += 20;

      return editorReducer(state, { type: 'ADD_ELEMENT', payload: newElement });
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'MARK_CLEAN':
      return {
        ...state,
        isDirty: false
      };

    default:
      return state;
  }
}

// 编辑器上下文接口
interface EditorContextValue {
  state: EditorState;
  
  // 画布操作
  setCanvas: (config: CanvasConfig) => void;
  
  // 元素操作
  addElement: (element: CollageElement) => void;
  updateElement: (id: string, changes: Partial<CollageElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  reorderElement: (id: string, newIndex: number) => void;
  
  // 编辑操作
  undo: () => void;
  redo: () => void;
  copyElement: (id: string) => void;
  pasteElement: () => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markClean: () => void;
  
  // 便捷访问
  canUndo: boolean;
  canRedo: boolean;
  selectedElement: CollageElement | null;
}

// 创建上下文
const EditorContext = createContext<EditorContextValue | null>(null);

// 编辑器提供者组件
export function EditorProvider({ children, initialCanvas, initialElements }: {
  children: React.ReactNode;
  initialCanvas?: CanvasConfig;
  initialElements?: CollageElement[];
}) {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    canvas: initialCanvas || initialState.canvas,
    elements: initialElements || initialState.elements
  });

  // 画布操作
  const setCanvas = useCallback((config: CanvasConfig) => {
    dispatch({ type: 'SET_CANVAS', payload: config });
  }, []);

  // 元素操作
  const addElement = useCallback((element: CollageElement) => {
    dispatch({ type: 'ADD_ELEMENT', payload: element });
  }, []);

  const updateElement = useCallback((id: string, changes: Partial<CollageElement>) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id, changes } });
  }, []);

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ELEMENT', payload: id });
  }, []);

  const selectElement = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ELEMENT', payload: id });
  }, []);

  const reorderElement = useCallback((id: string, newIndex: number) => {
    dispatch({ type: 'REORDER_ELEMENT', payload: { id, newIndex } });
  }, []);

  // 编辑操作
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const copyElement = useCallback((id: string) => {
    dispatch({ type: 'COPY_ELEMENT', payload: id });
  }, []);

  const pasteElement = useCallback(() => {
    dispatch({ type: 'PASTE_ELEMENT' });
  }, []);

  // 状态管理
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const markClean = useCallback(() => {
    dispatch({ type: 'MARK_CLEAN' });
  }, []);

  // 计算属性
  const canUndo = useMemo(() => state.historyIndex >= 0, [state.historyIndex]);
  const canRedo = useMemo(() => state.historyIndex < state.history.length - 1, [state.historyIndex, state.history.length]);
  const selectedElement = useMemo(() => 
    state.selectedElementId ? state.elements.find(el => el.id === state.selectedElementId) || null : null,
    [state.selectedElementId, state.elements]
  );

  const value: EditorContextValue = {
    state,
    setCanvas,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    reorderElement,
    undo,
    redo,
    copyElement,
    pasteElement,
    setLoading,
    setError,
    markClean,
    canUndo,
    canRedo,
    selectedElement
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

// 使用编辑器上下文的钩子
export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
} 