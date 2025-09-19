import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OKR } from '../types';
import { IconX, IconCheck } from './Icons';

interface KRSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKrIds: string[];
  allOkrs: OKR[];
  onSave: (newKrIds: string[]) => void;
  isInvalid?: boolean;
  triggerRef?: React.RefObject<HTMLElement>;
  useDropdown?: boolean;
}

const KRSelectionModal: React.FC<KRSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedKrIds,
  allOkrs,
  onSave,
  isInvalid = false,
  triggerRef,
  useDropdown = false
}) => {
  // 兼容性处理：将简单KR ID转换为复合ID
  const convertToCompositeIds = (krIds: string[], okrs: OKR[]): string[] => {
    const result: string[] = [];
    const usedKrIds = new Set<string>();
    
    for (const krId of krIds) {
      // 如果已经是复合ID格式，直接使用
      if (krId.includes('::')) {
        result.push(krId);
        continue;
      }
      
      // 对于简单ID，找到对应的OKR并创建复合ID
      for (const okr of okrs) {
        for (const kr of okr.keyResults) {
          if (kr.id === krId && !usedKrIds.has(krId)) {
            const compositeId = `${okr.id}::${kr.id}`;
            result.push(compositeId);
            usedKrIds.add(krId);
            break;
          }
        }
        if (usedKrIds.has(krId)) break;
      }
    }
    
    return result;
  };
  
  // 将复合ID转换回简单ID（为了与现有数据格式兼容）
  const convertToSimpleIds = (compositeIds: string[]): string[] => {
    return compositeIds.map(id => {
      if (id.includes('::')) {
        return id.split('::')[1]; // 取KR ID部分
      }
      return id;
    });
  };
  
  const [currentSelection, setCurrentSelection] = useState<string[]>(
    convertToCompositeIds(selectedKrIds || [], allOkrs)
  );

  useEffect(() => {
    console.log('🔧 KRSelectionModal useEffect:', { selectedKrIds, isOpen, currentSelection });
    // 只在模态框打开时重置选择状态，避免在关闭时重置
    if (isOpen) {
      const compositeIds = convertToCompositeIds(selectedKrIds || [], allOkrs);
      setCurrentSelection(compositeIds);
    }
  }, [selectedKrIds, isOpen, allOkrs]);

  const handleToggleOption = (okrId: string, krId: string) => {
    // 使用复合ID来确保唯一性
    const compositeId = `${okrId}::${krId}`;
    console.log('🔧 KRSelectionModal - Toggle KR:', { okrId, krId, compositeId, currentSelection });
    
    const selection = currentSelection || [];
    const newSelection = selection.includes(compositeId)
      ? selection.filter(id => id !== compositeId)
      : [...selection, compositeId];
      
    console.log('🔧 KRSelectionModal - New selection:', newSelection);
    setCurrentSelection(newSelection);
  };

  const handleSave = () => {
    console.log('🔧 KR Selection Modal - Save clicked, selection:', currentSelection);
    console.log('🔧 KR Selection Modal - Original selectedKrIds:', selectedKrIds);
    
    // 转换回简单ID格式以保持兼容性
    const simpleIds = convertToSimpleIds(currentSelection);
    console.log('🔧 KR Selection Modal - Converted to simple IDs:', simpleIds);
    
    onSave(simpleIds);
    onClose();
  };

  const handleCancel = () => {
    console.log('🔧 KRSelectionModal - Cancel clicked, resetting to:', selectedKrIds);
    const compositeIds = convertToCompositeIds(selectedKrIds || [], allOkrs);
    setCurrentSelection(compositeIds);
    onClose();
  };

  if (!isOpen) return null;

  // 弹窗固定在页面中间
  const getModalPosition = () => {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999999,
      pointerEvents: 'auto'
    }}>
      {/* 背景遮罩 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
        onClick={handleCancel}
      />
      
      {/* 弹窗内容 */}
      <div 
        style={{
          position: 'fixed',
          width: '800px',
          maxHeight: '600px',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          zIndex: 1000000,
          ...getModalPosition(),
        }}
        className="dark:bg-gray-800 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            选择关联的关键成果 (KR)
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconX className="w-6 h-6" />
          </button>
        </div>
        
        {/* 内容区域 */}
        <div className="p-6 max-h-96 overflow-y-auto bg-white dark:bg-gray-800">
          {allOkrs.map((okr, okrIndex) => {
            console.log('🔧 KRSelectionModal render OKR:', { okrIndex, okr, keyResults: okr.keyResults });
            return (
              <div key={okr.id} className="mb-6 last:mb-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-base leading-relaxed">
                  O{okrIndex + 1}: {okr.objective}
                </h3>
                <div className="space-y-3 pl-4">
                  {okr.keyResults.map((kr, krIndex) => {
                    // 使用复合ID来检查是否被选中
                    const compositeId = `${okr.id}::${kr.id}`;
                    const isChecked = currentSelection.includes(compositeId);
                    console.log('🔧 KRSelectionModal render KR:', { 
                      okrIndex: okrIndex + 1, 
                      krIndex: krIndex + 1, 
                      krId: kr.id, 
                      compositeId,
                      description: kr.description,
                      isChecked,
                      currentSelection 
                    });
                    return (
                      <label key={kr.id} className="flex items-start gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOption(okr.id, kr.id)}
                          className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          <span className="font-medium">KR{krIndex + 1}:</span> {kr.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 底部按钮 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3 bg-white dark:bg-gray-800">
          <button
            onClick={handleCancel}
            className="px-6 py-3 text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <IconCheck className="w-5 h-5" />
            确定
          </button>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 document.body
  return createPortal(modalContent, document.body);
};

export default KRSelectionModal;