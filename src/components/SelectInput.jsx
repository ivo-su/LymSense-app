import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuArrowDown } from 'react-icons/lu';

function SelectInput({ options = [], value, defaultValue, onChange, placeholder = 'Selecciona una opción', disabled = false, name, className, ariaLabel, style}) {
	const [open, setOpen] = useState(false);
	const [internalValue, setInternalValue] = useState(defaultValue);
	const [menuPosition, setMenuPosition] = useState({});
	const containerRef = useRef(null);
	const menuRef = useRef(null);

	const selectedValue = value !== undefined ? value : internalValue;
	const selectedOption = options.find((option) => option.value === selectedValue);

	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (
				!containerRef.current?.contains(event.target)
				&& !menuRef.current?.contains(event.target)
			) {
				setOpen(false);
			}
		};

		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	}, []);

	useLayoutEffect(() => {
		if (!open) return undefined;

		const updateMenuPosition = () => {
			const trigger = containerRef.current?.getBoundingClientRect();
			if (!trigger) return;

			const preferredHeight = Math.min(240, options.length * 42 + 8);
			const spaceBelow = window.innerHeight - trigger.bottom - 8;
			const spaceAbove = trigger.top - 8;
			const openAbove = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
			const availableHeight = Math.max(
				80,
				Math.min(240, openAbove ? spaceAbove : spaceBelow),
			);
			const menuHeight = Math.min(preferredHeight, availableHeight);
			const width = Math.min(trigger.width, window.innerWidth - 16);

			setMenuPosition({
				left: Math.max(8, Math.min(trigger.left, window.innerWidth - width - 8)),
				top: openAbove ? trigger.top - menuHeight - 4 : trigger.bottom + 4,
				width,
				maxHeight: availableHeight,
			});
		};

		updateMenuPosition();
		window.addEventListener('resize', updateMenuPosition);
		document.addEventListener('scroll', updateMenuPosition, true);

		return () => {
			window.removeEventListener('resize', updateMenuPosition);
			document.removeEventListener('scroll', updateMenuPosition, true);
		};
	}, [open, options.length]);

	const selectOption = (option) => {
		if (value === undefined) setInternalValue(option.value);
		onChange?.(option.value, option);
		setOpen(false);
	};

	const handleKeyDown = (event) => {
		if (disabled) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			setOpen((isOpen) => !isOpen);
		} else if (event.key === 'Escape') {
			setOpen(false);
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const currentIndex = options.findIndex((option) => option.value === selectedValue);
			const nextIndex = event.key === 'ArrowDown'
				? Math.min(currentIndex + 1, options.length - 1)
				: Math.max(currentIndex - 1, 0);
			if (options[nextIndex]) selectOption(options[nextIndex]);
		}
	};

	return (
		<div ref={containerRef} style={{ ...styles.container, ...style }} className={`custom-select ${className}`}>
			{name && <input type="hidden" name={name} value={selectedValue ?? ''} />}
			<button
				className='trigger'
				type="button"
				aria-haspopup="listbox"
				aria-label={ariaLabel || selectedOption?.label || placeholder}
				aria-expanded={open}
				disabled={disabled}
				onClick={() => setOpen((isOpen) => !isOpen)}
				onKeyDown={handleKeyDown}
				style={{ ...styles.trigger, ...(disabled ? styles.disabled : {}) }}
			>
				<span style={selectedOption ? styles.value : styles.placeholder}>
					{selectedOption?.label ?? placeholder}
				</span>
				<span aria-hidden="true" style={{ ...styles.arrow, transform: open ? 'rotate(180deg)' : 'none' }}><LuArrowDown /></span>
			</button>

			{open && createPortal(
				<div
					ref={menuRef}
					role="listbox"
					aria-label={ariaLabel || selectedOption?.label || placeholder}
					style={{ ...styles.menu, ...menuPosition }}
				>
					{options.map((option) => (
						<button
							type="button"
							role="option"
							aria-selected={option.value === selectedValue}
							key={option.value}
							onClick={() => selectOption(option)}
							style={{ ...styles.option, ...(option.value === selectedValue ? styles.selected : {}) }}
						>
							{option.label}
						</button>
					))}
				</div>,
				document.body,
			)}
		</div>
	);
}

const styles = {
	container: { position: 'relative', width: '100%', fontFamily: 'inherit' },
	// trigger: {
	// 	alignItems: 'center', background: 'none', border: 'none', borderRadius: 6,
	// 	boxSizing: 'border-box', cursor: 'pointer', display: 'flex', font: 'inherit', justifyContent: 'space-between',
	// 	minHeight: 0, padding: '0', textAlign: 'left', width: '100%',
	// },
	trigger: {
		alignItems: 'center',
		boxSizing: 'border-box', cursor: 'pointer', display: 'flex', font: 'inherit', justifyContent: 'space-between',
		minHeight: 0, textAlign: 'left', width: '100%',
	},
	placeholder: { color: '#64748b' },
	value: { color: '#0f172a' },
	arrow: { color: '#475569', fontSize: 18, lineHeight: 1, transition: 'transform 150ms ease',  display: 'flex', alignItems: 'center' },
	menu: {
		background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
		maxHeight: 240, overflowY: 'auto', padding: 4, position: 'fixed', zIndex: 1100,
	},
	option: {
		background: '#fff', border: 0, borderRadius: 4, cursor: 'pointer', display: 'block', font: 'inherit',
		padding: '10px 12px', textAlign: 'left', width: '100%'
	},
	selected: { background: '#e0f2fe', color: '#0369a1' },
	disabled: { cursor: 'not-allowed', opacity: 0.6 },
};

export default SelectInput;
