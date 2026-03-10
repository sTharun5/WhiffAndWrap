import { useState, useRef, useEffect } from 'react';
import './Select.css';

interface SelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchable?: boolean;
    className?: string;
    disabled?: boolean;
}

export default function Select({ options, value, onChange, placeholder = 'Select an option', searchable = false, className = '', disabled = false }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = searchable
        ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`custom-select ${className} ${disabled ? 'disabled' : ''}`} ref={wrapperRef} style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
            <div
                className={`custom-select__control ${isOpen ? 'active' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="custom-select__value">
                    {selectedOption ? selectedOption.label : <span className="custom-select__placeholder">{placeholder}</span>}
                </div>
                <div className={`custom-select__arrow ${isOpen ? 'open' : ''}`}>
                    ▼
                </div>
            </div>

            {isOpen && (
                <div className="custom-select__menu">
                    {searchable && (
                        <div className="custom-select__search-wrapper">
                            <input
                                type="text"
                                className="custom-select__search"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    )}
                    <div className="custom-select__options">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`custom-select__option ${opt.value === value ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''}`}
                                    style={opt.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    onClick={() => {
                                        if (opt.disabled) return;
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="custom-select__no-options">No options found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
