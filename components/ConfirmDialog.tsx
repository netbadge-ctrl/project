import React from 'react';
import ReactDOM from 'react-dom';
import { IconX, IconTrash, IconAlert } from './Icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'danger',
  icon
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          defaultIcon: <IconTrash className="w-6 h-6" />
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          defaultIcon: <IconAlert className="w-6 h-6" />
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          defaultIcon: <IconAlert className="w-6 h-6" />
        };
      default:
        return {
          iconBg: 'bg-gray-100 dark:bg-gray-900/20',
          iconColor: 'text-gray-600 dark:text-gray-400',
          confirmBtn: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
          defaultIcon: <IconAlert className="w-6 h-6" />
        };
    }
  };

  const styles = getTypeStyles();

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* 背景遮罩 */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* 对话框内容 */}
        <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-[#2d2d2d] px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-200 dark:border-[#4a4a4a] z-[10000]">
          {/* 关闭按钮 */}
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 dark:focus:ring-offset-[#2d2d2d]"
              onClick={onClose}
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            {/* 图标 */}
            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
              <div className={styles.iconColor}>
                {icon || styles.defaultIcon}
              </div>
            </div>

            {/* 内容 */}
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* 按钮组 */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#2d2d2d] sm:w-auto transition-all duration-200 ${styles.confirmBtn}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 dark:border-[#4a4a4a] bg-white dark:bg-[#3a3a3a] px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-[#404040] focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 dark:focus:ring-offset-[#2d2d2d] sm:mt-0 sm:w-auto transition-all duration-200"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(dialogContent, document.body);
};
