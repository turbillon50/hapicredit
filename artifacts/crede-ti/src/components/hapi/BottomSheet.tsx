import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoint?: 'auto' | 'half' | 'full';
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="sheet-backdrop fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white max-h-[88vh] flex flex-col"
            style={{ borderRadius: '22px 22px 0 0', boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.9 }}
          >
            <div className="shrink-0 pt-3 pb-1 px-5">
              <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              {title && (
                <h2 className="text-[15px] font-semibold text-gray-900 pb-3 border-b border-gray-100">
                  {title}
                </h2>
              )}
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 pb-safe scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
