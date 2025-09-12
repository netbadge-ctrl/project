import React, { useState, useEffect } from 'react';
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
  const [currentSelection, setCurrentSelection] = useState<string[]>(selectedKrIds || []);

  useEffect(() => {
    setCurrentSelection(selectedKrIds || []);
  }, [selectedKrIds, isOpen]);

  const handleToggleOption = (krId: string) => {
    const selection = currentSelection || [];
    const newSelection = selection.includes(krId)
      ? selection.filter(id => id !== krId)
      : [...selection, krId];
    setCurrentSelection(newSelection);
  };

  const handleSave = () => {
    onSave(currentSelection);
    onClose();
  };

  const handleCancel = () => {
    setCurrentSelection(selectedKrIds);
    onClose();
  };

  if (!isOpen) return null;

  if (useDropdown && triggerRef) {
    // 下拉菜单模式 - 使用简单的绝对定位
    return (
      <div 
        className="absolute top-full left-0 mt-1 bg-white dark:bg-[#2d2d2d] rounded-lg shadow-2xl w-[600px] max-h-[500px] flex flex-col border border-gray-200 dark:border-[#4a4a4a] z-[9999]"
      >
        <div className="p-4 border-b border-gray-200 dark:border-[#4a4a4a] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            选择关联的关键成果 (KR)
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {allOkrs.map((okr, okrIndex) => (
            <div key={okr.id} className="mb-6 last:mb-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-base leading-relaxed">
                O{okrIndex + 1}: {okr.objective}
              </h3>
              <div className="space-y-3 pl-4">
                {okr.keyResults.map((kr, krIndex) => (
                  <label key={kr.id} className="flex items-start gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-colors">
                    <input
                      type="checkbox"
                      checked={currentSelection.includes(kr.id)}
                      onChange={() => handleToggleOption(kr.id)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      <span className="font-medium">KR{krIndex + 1}:</span> {kr.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-[#4a4a4a] flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <IconCheck className="w-4 h-4 inline mr-1" />
            确定
          </button>
        </div>
      </div>
    );
  }

  // 全屏模态框模式
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-[#4a4a4a]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#4a4a4a]">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              选择关联的关键成果 (KR)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              选择与此项目相关的关键成果，可多选
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {allOkrs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">暂无 OKR 数据</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                请先在 OKR 管理页面创建目标和关键成果
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {allOkrs.map((okr, okrIndex) => (
                <div key={okr.id} className="border border-gray-200 dark:border-[#4a4a4a] rounded-lg overflow-hidden">
                  {/* OKR Header */}
                  <div className="bg-gray-50 dark:bg-[#3a3a3a] px-4 py-3 border-b border-gray-200 dark:border-[#4a4a4a]">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      O{okrIndex + 1}: {okr.objective}
                    </h3>
                  </div>

                  {/* Key Results */}
                  <div className="p-4">
                    {okr.keyResults.length === 0 ? (
                      <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                        此目标暂无关键成果
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {okr.keyResults.map((kr, krIndex) => {
                          const isSelected = (currentSelection || []).includes(kr.id);
                          return (
                            <label
                              key={kr.id}
                              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700'
                                  : 'bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#4a4a4a] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
                              }`}
                            >
                              {/* Custom Checkbox */}
                              <div className={`w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600'
                                  : 'bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && (
                                  <IconCheck className="w-3 h-3 text-white" />
                                )}
                              </div>

                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleOption(kr.id)}
                                className="sr-only"
                              />

                              <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm ${
                                  isSelected 
                                    ? 'text-indigo-900 dark:text-indigo-100' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  KR{krIndex + 1}: {kr.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-[#4a4a4a] bg-gray-50 dark:bg-[#2a2a2a]">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            已选择 {currentSelection.length} 个关键成果
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] rounded-lg transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KRSelectionModal;