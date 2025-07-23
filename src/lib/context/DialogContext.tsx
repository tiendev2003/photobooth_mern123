"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface DialogData {
  header: string;
  content: string;
}

interface DialogContextType {
  showDialog: (data: DialogData) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within DialogProvider");
  return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogData, setDialogData] = useState<DialogData>({ header: "", content: "" });

  const showDialog = (data: DialogData) => {
    setDialogData(data);
    setIsOpen(true);
  };

  const hideDialog = () => setIsOpen(false);

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 relative transform transition-all duration-300 scale-100 animate-in zoom-in-90">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{dialogData.header}</h2>
            <p className="text-gray-600 leading-relaxed mb-6">{dialogData.content}</p>
           
            <button
              onClick={hideDialog}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};