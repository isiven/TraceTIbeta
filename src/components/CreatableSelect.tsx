
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface CreatableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onCreateOption: (newValue: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const CreatableSelect: React.FC<CreatableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  onCreateOption,
  placeholder,
  required
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Filter options
  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm(''); // Clear search on select so next time it's fresh, or keep it? Standard is clear or match value.
    setIsOpen(false);
  };

  const handleCreate = () => {
    if (searchTerm.trim()) {
      onCreateOption(searchTerm.trim());
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const showCreateOption = searchTerm && !filteredOptions.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <label className="block text-sm font-semibold text-darkGray">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="relative">
        <div
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white cursor-text flex justify-between items-center"
          onClick={() => setIsOpen(true)}
        >
          {isOpen ? (
            <input
              autoFocus
              type="text"
              className="w-full outline-none text-darkGray placeholder-gray-400 bg-transparent"
              placeholder={placeholder || "Type to search..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          ) : (
            <span className={value ? "text-darkGray" : "text-gray-500"}>
              {value || placeholder || "Select or type..."}
            </span>
          )}
          <ChevronDown size={20} className="text-gray-400 shrink-0 ml-2" />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-darkGray text-sm"
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))}
            
            {showCreateOption && (
              <div
                className="px-4 py-2 hover:bg-green-50 cursor-pointer text-primary font-medium text-sm flex items-center gap-2 border-t border-gray-100"
                onClick={handleCreate}
              >
                <Plus size={16} />
                Create "{searchTerm}"
              </div>
            )}

            {!showCreateOption && filteredOptions.length === 0 && (
               <div className="px-4 py-3 text-mediumGray text-sm italic">
                 No matches found.
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
